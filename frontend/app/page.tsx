"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DumbbellIcon,
  HeartIcon,
  TrendingUpIcon,
  SpaceIcon as Yoga,
  Zap,
  Baby,
  Sparkles,
} from "lucide-react";
import { WorkoutCard } from "../components/workout-card";
import workoutData from "./data.json";

// new stylesheet
import '../styles/homePage.css';

interface Workout {
  id: string;
  title: string;
  duration: string;
  level: string;
  calories: string;
  image: string;
  category: string;
  description: string;
  exercises: string[];
}

interface WorkoutsByCategory {
  [key: string]: Workout[];
}

interface WorkoutCategory {
  id: string;
  name: string;
  icon: string;
}

// Fake data
const fakeUser = {
  username: "Sarah",
  streak: 5,
};

const fakeRecommendation = {
  workoutId: "workout-1",
  title: "Low-Impact Energy Boost",
  recommendation: "Perfect for day 15 of your cycle",
};

export default function HomePage() {
  const [data, setData] = useState<{
    workoutCategories: WorkoutCategory[];
    workouts: WorkoutsByCategory;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("yoga");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Define the workout categories
      const workoutCategories: WorkoutCategory[] = [
        { id: "yoga", name: "Yoga", icon: "yoga" },
        { id: "hiit", name: "HIIT", icon: "zap" },
        { id: "strength", name: "Strength", icon: "dumbbell" },
        { id: "prenatal", name: "Prenatal", icon: "baby" },
        { id: "postnatal", name: "Postnatal", icon: "sparkles" },
        { id: "others", name: "Others", icon: "heart" },
      ];

      // Group workouts by category
      const workouts: WorkoutsByCategory = workoutData.reduce(
        (acc: WorkoutsByCategory, workout: Workout) => {
          const category = workout.category.toLowerCase();
          const categoryId =
            category === "yoga"
              ? "yoga"
              : category === "hiit"
              ? "hiit"
              : category === "strength"
              ? "strength"
              : category === "prenatal"
              ? "prenatal"
              : category === "postnatal"
              ? "postnatal"
              : "others";

          if (!acc[categoryId]) {
            acc[categoryId] = [];
          }
          acc[categoryId].push(workout);
          return acc;
        },
        {}
      );

      setData({ workoutCategories, workouts });
      setLoading(false);
    }

    // Get the saved tab from localStorage
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("selectedWorkoutTab");
      if (savedTab) {
        setSelectedTab(savedTab);
      }
    }

    loadData();
  }, []);

  const saveSelectedTab = (value: string) => {
    setSelectedTab(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedWorkoutTab", value);
    }
  };

  if (loading || !data) {
    return (
      <div className="container px-4 py-6 md:py-10 pb-20 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }

  const { workoutCategories, workouts } = data;
  return (
    <div className="container px-4 py-6 md:py-10 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="welcome-heading">
                Welcome back, {fakeUser.username}!
              </h1>
              <p className="text-muted-foreground">
                Ready for your 7-minute workout today?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Today's Recommendation</CardTitle>
                <CardDescription>
                  Based on your cycle and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
                  <div className="bg-pink-100 rounded-full p-3">
                    <HeartIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-semibold text-lg">
                      {fakeRecommendation.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {fakeRecommendation.recommendation}
                    </p>
                  </div>
                  <Button>Start Workout</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-100 to-pink-50 border-none shadow-md">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="bg-white/80 rounded-full p-3 mb-3 shadow-sm">
                  <TrendingUpIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">
                  {fakeUser.streak > 0 ? fakeUser.streak : "Start your streak!"}
                </p>
                <p className="text-sm font-medium text-muted-foreground">
                  Day Streak
                </p>
                <p className="text-xs mt-2">
                  {fakeUser.streak > 0 ? "Keep it up!" : "Let's get started!"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
              Workout Categories
            </h2>
          </div>

          <Tabs
            value={selectedTab}
            onValueChange={saveSelectedTab}
            className="w-full"
          >
            <div className="bg-pink-100/50 p-2 rounded-lg mb-4">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto bg-white/80 p-1 rounded-md shadow-sm">
                {workoutCategories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="py-3 data-[state=active]:bg-pink-100 data-[state=active]:text-primary"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {getIconComponent(category.icon)}
                      <span className="text-xs">{category.name}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {workoutCategories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workouts[category.id]?.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workoutData={workout}
                      href={`/workout/${workout.id}`}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </div>
  );
}

// Helper function to get the icon component based on the icon name
function getIconComponent(iconName: string) {
  switch (iconName) {
    case "yoga":
      return <Yoga className="h-5 w-5" />;
    case "zap":
      return <Zap className="h-5 w-5" />;
    case "dumbbell":
      return <DumbbellIcon className="h-5 w-5" />;
    case "heart":
      return <HeartIcon className="h-5 w-5" />;
    case "baby":
      return <Baby className="h-5 w-5" />;
    case "sparkles":
      return <Sparkles className="h-5 w-5" />;
    default:
      return <DumbbellIcon className="h-5 w-5" />;
  }
}
