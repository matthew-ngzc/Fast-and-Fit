"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bot, Send, User, Check } from "lucide-react";
import config from "@/config";

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  showActions?: boolean;
  workoutId?: string;
  isLoading?: boolean;
};

interface WorkoutExercise {
  name: string;
  duration: number;
  rest: number;
}

interface WorkoutData {
  calories: number | null;
  category: string;
  description: string;
  durationInMinutes: number;
  image: string | null;
  level: string;
  name: string;
  workoutExercise: WorkoutExercise[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! I'm your Fit&Fast AI assistant. How can I help you with your fitness journey today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveWorkoutToLocalStorage = (workoutData: WorkoutData): void => {
    const sanitizedWorkoutData = {
      ...workoutData,
      calories: workoutData.calories ?? 250,
    };
    localStorage.setItem("workout", JSON.stringify(workoutData));
  };

  // Sample quick questions
  const quickQuestions = [
    "Can you lower the difficulty because it's my period?",
    "How can I make the workout more intense?",
    "Generate a 7-minute workout for me",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCurrentWorkout = () => {
    if (typeof window !== "undefined") {
      const currentWorkoutStr = localStorage.getItem("currentWorkout");
      return currentWorkoutStr ? JSON.parse(currentWorkoutStr) : null;
    }
    return null;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() === "" || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setLoading(true);

    // Add loading message
    const loadingMessageId = Date.now().toString() + "-loading";
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      content: "Thinking",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const botResponse = await getBotResponse(inputValue);
      // Replace the loading message with the actual response
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessageId).concat(botResponse)
      );
    } catch (error) {
      console.error("Error in handleSend:", error);
      // Replace loading message with error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessageId).concat({
          id: Date.now().toString(),
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          sender: "bot",
          timestamp: new Date(),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: question,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setLoading(true);

    // Add loading message
    const loadingMessageId = Date.now().toString() + "-loading";
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      content: "Thinking",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const botResponse = await getBotResponse(question);
      // Replace the loading message with the actual response
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessageId).concat(botResponse)
      );
    } catch (error) {
      console.error("Error in handleQuickQuestion:", error);
      // Replace loading message with error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== loadingMessageId).concat({
          id: Date.now().toString(),
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          sender: "bot",
          timestamp: new Date(),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutAction = async (accept: boolean, workoutId: string) => {
    setMessages(
      messages.map((msg) =>
        msg.workoutId === workoutId ? { ...msg, showActions: false } : msg
      )
    );

    if (accept) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: "I'll try this workout!",
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      // Add loading message
      const loadingMessageId = Date.now().toString() + "-loading";
      setMessages(prev => [...prev, {
        id: loadingMessageId,
        content: "Processing your workout",
        sender: "bot",
        timestamp: new Date(),
        isLoading: true
      }]);

      try {
        const userId = localStorage.getItem("userId") || "default";
        const token = localStorage.getItem("token") || "";
        const workoutData = JSON.parse(localStorage.getItem("workout") || "{}");
        const response = await fetch(`${config.BOT_URL}/${userId}/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(workoutData),
        });

        if (!response.ok) {
          throw new Error("Failed to save workout");
        }

        const data = await response.json();
        saveWorkoutToLocalStorage(data);

        localStorage.removeItem("workout"); 
        localStorage.setItem("currentWorkout", JSON.stringify(data));

        // Remove loading message
        setMessages(prev => 
          prev.filter(msg => msg.id !== loadingMessageId).concat({
            id: Date.now().toString(),
            content: `Great! I've added this workout to your routine. Redirecting you to your personalised workout plan...`,
            sender: "bot",
            timestamp: new Date(),
          })
        );
        
        setTimeout(() => {
          window.location.href = `/workout/${data.workoutId}`;
        }, 2000); 
      } catch (error) {
        console.error("Error saving workout:", error);
        // Replace loading message with error message
        setMessages(prev => 
          prev.filter(msg => msg.id !== loadingMessageId).concat({
            id: Date.now().toString(),
            content: "Sorry, there was an error saving your workout. Please try again later.",
            sender: "bot",
            timestamp: new Date(),
          })
        );
      } finally {
        setLoading(false);
      }
    } 
  };

  const getBotResponse = async (message: string): Promise<Message> => {
    try {
      const userId = localStorage.getItem("userId") || "default";
      const token = localStorage.getItem("token") || "";
      const currentWorkout = getCurrentWorkout();

      const response = await fetch(`${config.BOT_URL}/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
          exercises: currentWorkout?.workoutExercise || [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const data = await response.json();
      const workoutData = data.workout;
      if (workoutData) {
        saveWorkoutToLocalStorage(workoutData);
      }

      const showActions = !!data.workout;
      const workoutId = data.workout?.workoutId?.toString() || "";

      return {
        id: Date.now().toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
        showActions,
        workoutId,
      };
    } catch (error) {
      return {
        id: Date.now().toString(),
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
    }
  };

  // Component for the typing indicator animation
  const TypingIndicator = () => (
    <div className="flex space-x-1">
      <div className="dot-typing"></div>
      <div className="dot-typing animation-delay-200"></div>
      <div className="dot-typing animation-delay-400"></div>
    </div>
  );

  return (
    <div className="container px-4 py-6 md:py-10 max-w-2xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/home"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Fitness AI Assistant</h1>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            FitBuddy
          </CardTitle>
          <CardDescription>
            Ask questions about your workouts or get personalized workouts
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-[calc(100vh-280px)] overflow-y-auto px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-lg p-3 
                      ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/80 border"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === "bot" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.sender === "bot" ? "FitBuddy" : "You"}
                      </span>
                    </div>
                    <div className="whitespace-pre-line">
                      {message.isLoading ? (
                        <div className="flex items-center">
                          <span>{message.content}</span>
                          <span className="ml-1 inline-flex">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse animation-delay-200">.</span>
                            <span className="animate-pulse animation-delay-400">.</span>
                          </span>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>

                    {message.showActions && (
                      <div className="flex gap-2 mt-3 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() =>
                            handleWorkoutAction(true, message.workoutId || "")
                          }
                        >
                          <Check className="h-4 w-4" /> Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-background pt-4">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestion(question)}
                className="text-sm"
                disabled={loading}
              >
                {question}
              </Button>
            ))}
          </div>
          <div className="flex w-full gap-2">
            <Input
              placeholder={loading ? "Waiting for response..." : "Type your message..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <Button size="icon" onClick={handleSend} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Add these CSS styles to your global stylesheet */}
      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animate-pulse {
          animation: blink 1.4s infinite both;
        }
      `}</style>
    </div>
  );
}