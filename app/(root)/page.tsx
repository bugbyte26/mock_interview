import InterviewCard from "@/components/InterviewCard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserID,
  getLatestInterviews,
} from "@/lib/actions/general.action";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Please sign in to view your interviews.</p>
      </div>
    );
  }

  const [userInterviews, latestInterviews] = await Promise.all([
    getInterviewsByUserID(user?.id),
    getLatestInterviews({ userId: user?.id }),
  ]);

  const hasPastInterviews = userInterviews && userInterviews.length > 0;
  const hasUpcomingInterviews = latestInterviews && latestInterviews.length > 0;

  return (
    <>
      <section className="card-cta">
        {/* <p>{user.id}</p> */}
        <div className="flex flex-col max-w-lg gap-6">
          <h2>Get interview ready with AI-Powered practice & Feedback</h2>
          <p className="text-lg">
            Practice on real interview questions & get feedback
          </p>
          <Button asChild className="btn-primary max-sm:w-full">
            <Link href={"/interview"}>Start Practicing</Link>
          </Button>
        </div>
        <Image
          alt="robo-dude"
          src={"/robot.png"}
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews.map((interview) => (
              <InterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <p>You have no past interviews.</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an interview</h2>
        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            latestInterviews.map((interview) => (
              <InterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <p>There are no interviews yet.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default page;
