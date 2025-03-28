"use client";

import type React from "react";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";

import axios, { AxiosError } from "axios";
import config from "../../../config";

export default function QuestionnairePage() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    height: "",
    weight: "",
    birthdate: "",
    fitnessLevel: "",
    menstrualCramps: "",
    pregnancyStatus: "",
    cycleBasedRecommendations: "",
    workoutType: "",
    workoutDays: "",
    fitnessGoal: "",
    cycleLength: "",
    periodLength: "",
    lastPeriodDate: "",
    currentStreak: 0,
    longestStreak: 0,
  });

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    isSelect = false
  ) => {
    const { name, value } = e.target;

    if (isSelect) {
      // Handle the change for Select components
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      // Handle regular input changes
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const userIdLong = userId ? parseInt(userId, 10) : null; 

      if (!token) {
        alert("Unauthorised Action");
        window.location.href = "/auth/login";
        return;
      }

      const requestData = {
        userId: userIdLong, // tmp to change once backend updates
        username: formData.username,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        dob: formData.birthdate,
        fitnessLevel: formData.fitnessLevel,
        menstrualCramps: formData.menstrualCramps === "yes",
        pregnancyStatus: formData.pregnancyStatus?.toUpperCase(),
        cycleBasedRecommendations: formData.cycleBasedRecommendations === "yes",
        workoutType: formData.workoutType,
        workoutDays: parseInt(formData.workoutDays) || 0,
        fitnessGoal: formData.fitnessGoal,
        cycleLength: parseInt(formData.cycleLength) || 28,
        periodLength: parseInt(formData.periodLength) || 5,
        lastPeriodDate: formData.lastPeriodDate || null,
        currentStreak: 0,
        longestStreak: 0,
      };

      console.log("Submitting request:", requestData); // Debugging log
      console.log(token)
      const response = await fetch(`${config.USER_URL}/questionnaire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      // window.location.href = "/";
    } catch (error) {
      alert(`Error submitting form`);
      console.error(error);
    }
  };

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-10">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 max-w-md">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <div className="bg-pink-100 p-2 rounded-full">
              <img src="/icon.png" alt="Fit&Fast" className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Let's personalize your experience
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us about yourself so we can customize your workouts
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{getStepTitle(step)}</span>
          </div>
          <Progress
            value={(step / totalSteps) * 100}
            className="h-2 transition-all duration-500 ease-in-out"
          />
        </div>

        {step === 1 && (
          <Card className="border-none shadow-md bg-gradient-to-b from-white to-pink-50">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Alice"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="165"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitness-level">Fitness Level</Label>
                <Select
                  value={formData.fitnessLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fitnessLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={nextStep}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-none shadow-md bg-gradient-to-b from-white to-pink-50">
            <CardHeader>
              <CardTitle>Women's Health</CardTitle>
              <CardDescription>
                Help us tailor workouts to your specific needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Do you experience menstrual cramps or period-related
                  discomfort?
                </Label>
                <RadioGroup
                  name="menstrualCramps"
                  value={formData.menstrualCramps}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      menstrualCramps: value,
                    })
                  }
                  defaultValue="no"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="yes" id="cramps-yes" />
                    <Label htmlFor="cramps-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="no" id="cramps-no" />
                    <Label htmlFor="cramps-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Are you currently pregnant or postpartum?</Label>
                <RadioGroup
                  name="pregnancyStatus"
                  value={formData.pregnancyStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      pregnancyStatus: value,
                    })
                  }
                  defaultValue="no"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="pregnant" id="pregnant" />
                    <Label htmlFor="pregnant">Yes, pregnant</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="postpartum" id="postpartum" />
                    <Label htmlFor="postpartum">Yes, postpartum</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="no" id="not-pregnant" />
                    <Label htmlFor="not-pregnant">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>
                  Would you like cycle-based workout recommendations?
                </Label>
                <RadioGroup
                  name="cycleBasedRecommendations"
                  value={formData.cycleBasedRecommendations}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cycleBasedRecommendations: value,
                    })
                  }
                  defaultValue="yes"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="yes" id="cycle-yes" />
                    <Label htmlFor="cycle-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="no" id="cycle-no" />
                    <Label htmlFor="cycle-no">No</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  This helps us adjust workouts based on your menstrual cycle
                  phase
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={nextStep}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-none shadow-md bg-gradient-to-b from-white to-pink-50">
            <CardHeader>
              <CardTitle>Cycle Information</CardTitle>
              <CardDescription>
                Help us adapt your workouts to your menstrual cycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Fit&Fast helps track your menstrual cycle to recommend the
                  most effective workouts for each phase, optimizing your
                  fitness results and comfort.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="cycleLength">Cycle Length (days)</Label>
                  <Select
                    value={formData.cycleLength}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cycleLength: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle length" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 21).map(
                        (days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} days
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Average time from the first day of one period to the first
                    day of the next
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="periodLength">Period Length (days)</Label>
                  <Select
                    value={formData.periodLength}
                    onValueChange={(value) =>
                      setFormData({ ...formData, periodLength: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period length" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} days
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="lastPeriodDate">Last Period Start Date</Label>
                  <Input
                    id="lastPeriodDate"
                    name="lastPeriodDate"
                    type="date"
                    value={formData.lastPeriodDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={nextStep}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-none shadow-md bg-gradient-to-b from-white to-pink-50">
            <CardHeader>
              <CardTitle>Workout Preferences</CardTitle>
              <CardDescription>
                Tell us how you like to exercise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Do you prefer high-energy workouts or low-impact workouts?
                </Label>
                <RadioGroup
                  name="workoutType"
                  value={formData.workoutType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      workoutType: value,
                    })
                  }
                  defaultValue="high-energy"
                >
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="high-energy" id="high-energy" />
                    <Label htmlFor="high-energy">
                      High-Energy (HIIT, Strength)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="low-impact" id="low-impact" />
                    <Label htmlFor="low-impact">
                      Low-Impact (Yoga, Stretching)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-pink-50 transition-colors">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout-days">
                  How many days per week do you plan to work out?
                </Label>
                <Select
                  name="workoutDays"
                  value={formData.workoutDays}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      workoutDays: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>What is your primary fitness goal?</Label>
                <Select
                  value={formData.fitnessGoal}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fitnessGoal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Fitness</SelectItem>
                    <SelectItem value="weight-loss">Weight Loss</SelectItem>
                    <SelectItem value="strength">Strength Building</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="stress-relief">Stress Relief</SelectItem>
                    <SelectItem value="prenatal">Prenatal</SelectItem>
                    <SelectItem value="post-pregnancy">
                      Post-Pregnancy Recovery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
              >
                Complete
              </Button>
              {/* <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => (window.location.href = "/")}
              >
                Complete
              </Button> */}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Basic Information";
    case 2:
      return "Women's Health";
    case 3:
      return "Cycle Information";
    case 4:
      return "Workout Preferences";
    default:
      return "";
  }
}
