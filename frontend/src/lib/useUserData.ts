import { useEffect, useState } from "react";
import {
    doc,
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillDomain =
    | "rtl" | "digital" | "sta" | "physical" | "dft" | "scripting";

export interface SkillScores {
    rtl: number; digital: number; sta: number;
    physical: number; dft: number; scripting: number;
}

export interface RoadmapDay {
    day: number;
    focus: string;
    tasks: string[];
    revision: boolean;
}

export interface StudyPlan {
    roadmap: RoadmapDay[];
    daysRemaining: number;
    weakTopicsUsed: SkillDomain[];
    readinessScore: number;
    interviewDate?: string;
    targetRole?: string;
    hoursPerDay?: number;
}

export interface EvaluationRecord {
    overallScore: number;
    type: string;
    topic: string;
    createdAt?: { seconds: number; nanoseconds: number };
}

export interface UserData {
    skillScores: SkillScores;
    readinessScore: number;
    confidenceScore: number;
    weakTopics: SkillDomain[];
}

interface UseUserDataReturn {
    userData: UserData | null;
    studyPlan: StudyPlan | null;
    recentEvals: EvaluationRecord[];
    loading: boolean;
}

const DEFAULT_SCORES: SkillScores = {
    rtl: 0, digital: 0, sta: 0, physical: 0, dft: 0, scripting: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserData(): UseUserDataReturn {
    const { user } = useAppStore();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [recentEvals, setRecentEvals] = useState<EvaluationRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const uid = user.uid;

        // Track how many of the 3 listeners have resolved at least once
        let resolved = 0;
        const markResolved = () => {
            resolved++;
            if (resolved >= 3) setLoading(false);
        };

        // 1) User document — real-time
        const unsubUser = onSnapshot(
            doc(firestore, "users", uid),
            (snap) => {
                if (snap.exists()) {
                    const d = snap.data();
                    setUserData({
                        skillScores: d.skillScores ?? DEFAULT_SCORES,
                        readinessScore: d.readinessScore ?? 0,
                        confidenceScore: d.confidenceScore ?? 0,
                        weakTopics: d.weakTopics ?? [],
                    });
                }
                markResolved();
            },
            () => markResolved(),   // error → still unblock loading
        );

        // 2) Study plan document — real-time
        const unsubPlan = onSnapshot(
            doc(firestore, "studyPlans", uid),
            (snap) => {
                setStudyPlan(snap.exists() ? (snap.data() as StudyPlan) : null);
                markResolved();
            },
            () => markResolved(),
        );

        // 3) Recent submissions — real-time
        const evalQuery = query(
            collection(firestore, "submissions"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc"),
            limit(10),
        );
        const unsubEvals = onSnapshot(
            evalQuery,
            (snap) => {
                setRecentEvals(snap.docs.map((d) => d.data() as EvaluationRecord));
                markResolved();
            },
            () => markResolved(),
        );

        return () => {
            unsubUser();
            unsubPlan();
            unsubEvals();
        };
    }, [user]);

    return { userData, studyPlan, recentEvals, loading };
}
