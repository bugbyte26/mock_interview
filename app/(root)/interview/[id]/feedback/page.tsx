import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  Trophy,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Home,
  RotateCcw,
  Star,
  CheckCircle,
  Target,
} from "lucide-react";

// Circular Progress Component
interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress = ({
  score,
  size = 120,
  strokeWidth = 8,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Emerald
    if (score >= 60) return "#F59E0B"; // Amber
    if (score >= 40) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-sm text-gray-400">/ 100</div>
        </div>
      </div>
    </div>
  );
};

// Category Score Card Component
interface CategoryScoreCardProps {
  category: Feedback["categoryScores"][number];
  index: number;
}

const CategoryScoreCard = ({ category, index }: CategoryScoreCardProps) => {
  return (
    <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 pr-6">
          <h3 className="text-xl font-semibold text-white mb-3 leading-tight">
            {index + 1}. {category.name}
          </h3>
          <p className="text-gray-300 leading-relaxed text-base">
            {category.comment}
          </p>
        </div>
        <div className="flex-shrink-0">
          <CircularProgress score={category.score} size={100} strokeWidth={6} />
        </div>
      </div>
    </div>
  );
};

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <div className="min-h-screen ">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 backdrop-blur-xl bg-white/10 border border-white/20 px-8 py-4 rounded-full mb-12 shadow-2xl">
            <Trophy className="text-yellow-400" size={32} />
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Interview Feedback
            </h1>
          </div>

          {/* Main Stats Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 mb-16 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-8 capitalize">
              {interview.role} Position Interview
            </h2>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
              {/* Overall Score */}
              <div className="text-center">
                <div className="mb-6">
                  <CircularProgress
                    score={feedback?.totalScore || 0}
                    size={180}
                    strokeWidth={12}
                  />
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Star className="text-yellow-400" size={24} />
                  <span className="text-xl font-semibold text-white">
                    Overall Performance
                  </span>
                </div>
                <p className="text-gray-400 text-base">Your interview score</p>
              </div>

              {/* Interview Details */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 min-w-[300px]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Calendar className="text-blue-400" size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-sm mb-1">Interview Date</p>
                    <p className="text-white font-semibold text-lg">
                      {feedback?.createdAt
                        ? dayjs(feedback.createdAt).format("MMM D, YYYY")
                        : "N/A"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {feedback?.createdAt
                        ? dayjs(feedback.createdAt).format("h:mm A")
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Assessment */}
        {feedback?.finalAssessment && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 mb-16 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <CheckCircle className="text-emerald-400" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Overall Assessment
              </h2>
            </div>
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
              <p className="text-gray-200 leading-relaxed text-lg">
                {feedback.finalAssessment}
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {feedback?.categoryScores && feedback.categoryScores.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="text-purple-400" size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Performance Breakdown
              </h2>
            </div>
            <div className="grid gap-8">
              {feedback.categoryScores.map((category, index) => (
                <CategoryScoreCard
                  key={index}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Strengths and Improvements */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Strengths */}
          {feedback?.strengths && feedback.strengths.length > 0 && (
            <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/20 rounded-3xl p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <CheckCircle className="text-emerald-400" size={28} />
                </div>
                <h2 className="text-3xl font-bold text-emerald-300">
                  Strengths
                </h2>
              </div>
              <div className="space-y-6">
                {feedback.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg mt-1 flex-shrink-0">
                        <CheckCircle className="text-emerald-400" size={16} />
                      </div>
                      <p className="text-gray-200 leading-relaxed text-base">
                        {strength}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {feedback?.areasForImprovement &&
            feedback.areasForImprovement.length > 0 && (
              <div className="backdrop-blur-xl w-full rounded-3xl p-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Target className="text-amber-400" size={28} />
                  </div>
                  <h2 className="text-3xl font-bold text-amber-300">
                    Areas for Growth
                  </h2>
                </div>
                <div className="space-y-6">
                  {feedback.areasForImprovement.map((area, index) => (
                    <div
                      key={index}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg mt-1 flex-shrink-0">
                          <Target className="text-amber-400" size={16} />
                        </div>
                        <p className="text-gray-200 leading-relaxed text-base">
                          {area}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto">
          <Button className="flex-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <Link
              href="/"
              className="flex items-center justify-center gap-4 w-full"
            >
              <Home size={22} />
              <span className="text-lg font-semibold">Back to Dashboard</span>
            </Link>
          </Button>

          <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <Link
              href={`/interview/${id}`}
              className="flex items-center justify-center gap-4 w-full"
            >
              <RotateCcw size={22} />
              <span className="text-lg font-semibold">Retake Interview</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
