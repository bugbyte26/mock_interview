"use client";

import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";
import { generator } from "@/constants";
//import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const assistantIdEnvByType = {
  interview: "NEXT_PUBLIC_VAPI_INTERVIEW_ASSISTANT_ID",
} as const;

const replaceWorkflowVariables = (
  value: unknown,
  variables: Record<string, string>
): unknown => {
  if (typeof value === "string") {
    return Object.entries(variables).reduce(
      (currentValue, [key, replacement]) =>
        currentValue
          .replaceAll(`{{${key}}}`, replacement)
          .replaceAll(`{{ ${key} }}`, replacement),
      value
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceWorkflowVariables(item, variables));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceWorkflowVariables(item, variables),
      ])
    );
  }

  return value;
};

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
}: AgentProps) => {
  //console.log(userName, userId, type);
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  const getCallErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      const maybeError = error as {
        message?: string;
        error?: { message?: string };
        data?: { error?: { message?: string } };
      };

      return (
        maybeError.data?.error?.message ||
        maybeError.error?.message ||
        maybeError.message ||
        "Unknown Vapi call error"
      );
    }

    return "Unknown Vapi call error";
  }, []);

  const formatCallError = useCallback((error: unknown) => {
    const message = getCallErrorMessage(error);

    try {
      return JSON.stringify(error) || message;
    } catch {
      return message;
    }
  }, [getCallErrorMessage]);

  const showCallError = useCallback((error: unknown) => {
    const message = getCallErrorMessage(error);
    if (/assistant.*does not exist/i.test(message)) {
      const assistantEnv = assistantIdEnvByType.interview;
      toast.error(`Invalid Vapi assistant ID. Update ${assistantEnv}.`);
      return;
    }

    toast.error(message || "Unable to start the Vapi call.");
  }, [getCallErrorMessage, type]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      console.log("Vapi error:", formatCallError(error), error);
      showCallError(error);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [formatCallError, showCallError]);

  //console.log(interviewId, userId, type, messages);

  const handleGenerateFeedback = async (messages: SavedMessage[]) => {
    if (!interviewId || !userId) {
      console.log("Missing required data");
      router.push("/");
      return;
    }

    const { success, id } = await createFeedback({
      interviewId,
      userId,
      transcript: messages,
    });

    if (success && id) {
      console.log("Feedback created successfully with ID:", id);
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log("Failed to create feedback. Please try again later.");
      router.push("/");
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, router, type, userId]);

  const handleCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);

      if (type === "generate") {
        const userVariables = {
          username: userName || "User",
          userid: userId || "",
        };
        const assistantOverrides = {
          variableValues: userVariables,
        };
        const workflow = replaceWorkflowVariables(
          generator,
          userVariables
        ) as Parameters<typeof vapi.start>[3];

        await vapi.start(
          undefined,
          assistantOverrides,
          undefined,
          workflow
        );
      } else {
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((q, index) => `${index + 1}. ${q}`)
            .join("\n");
        }

        const overrides = {
          variableValues: {
            username: userName || "User",
            questions: formattedQuestions,
          },
        };

        const assistantId =
          process.env.NEXT_PUBLIC_VAPI_INTERVIEW_ASSISTANT_ID;

        if (!assistantId) {
          throw new Error(
            `Missing ${assistantIdEnvByType.interview}. Add it to .env.local or .env.`
          );
        }

        await vapi.start(assistantId, overrides);
      }

      console.log("Call started successfully");
      setCallStatus(CallStatus.ACTIVE);
    } catch (error) {
      console.error("Error starting call:", formatCallError(error), error);
      showCallError(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    try {
      setCallStatus(CallStatus.FINISHED);
      vapi.stop();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
