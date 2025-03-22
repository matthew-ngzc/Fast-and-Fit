// UserDetails.java
package com.fastnfit.app.model;

import com.fastnfit.app.enums.*;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "user_details")
public class UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String username;
    private Date dob;
    private Double height;
    private Double weight;
    @Enumerated(EnumType.STRING)
    private PregnancyStatus pregnancyStatus = PregnancyStatus.NO;
    @Enumerated(EnumType.STRING)
    private WorkoutGoal workoutGoal;
    private Integer workoutDays;

    @Enumerated(EnumType.STRING)
    private FitnessLevel fitnessLevel;
    private boolean menstrualCramps;
    private boolean cycleBasedRecommendations;
    @Enumerated(EnumType.STRING)
    private WorkoutType workoutType;
    private String avatar= "/avatars/avatar.png";

    // Added field for tracking current streak
    private Integer currentStreak;

    // Added field for tracking longest streak
    private Integer longestStreak;

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int streak) {
        this.currentStreak = streak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Date getDob() {
        return dob;
    }

    public void setDob(Date dob) {
        this.dob = dob;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public PregnancyStatus getPregnancyStatus() {
        return pregnancyStatus;
    }

    public void setPregnancyStatus(String inputString) {
        this.pregnancyStatus = PregnancyStatus.fromValue(inputString);
    }

    public void setPregnancyStatus(PregnancyStatus pregnancyStatus) {
        this.pregnancyStatus = pregnancyStatus;
    }

    public WorkoutGoal getWorkoutGoal() {
        return workoutGoal;
    }

    public void setWorkoutGoal(String inputString) {
        this.workoutGoal = WorkoutGoal.fromString(inputString);
    }

    public void setWorkoutGoal(WorkoutGoal workoutGoal) {
        this.workoutGoal = workoutGoal;
    }

    public Integer getWorkoutDays() {
        return workoutDays;
    }

    public void setWorkoutDays(Integer workoutDays) {
        this.workoutDays = workoutDays;
    }

    public FitnessLevel getFitnessLevel() {
        return fitnessLevel;
    }

    public void setFitnessLevel(FitnessLevel fitnessLevel) {
        this.fitnessLevel = fitnessLevel;
    }

    public boolean getMenstrualCramps() {
        return menstrualCramps;
    }

    public void setMenstrualCramps(boolean menstrualCramps) {
        this.menstrualCramps = menstrualCramps;
    }

    public boolean getCycleBasedRecommendations() {
        return cycleBasedRecommendations;
    }

    public void setCycleBasedRecommendations(boolean cycleBasedRecommendations) {
        this.cycleBasedRecommendations = cycleBasedRecommendations;
    }

    public WorkoutType getWorkoutType() {
        return workoutType;
    }

    public void setWorkoutType(String inputString) {
        this.workoutType = WorkoutType.fromString(inputString);
    }

    public void setWorkoutType(WorkoutType workoutType) {
        this.workoutType = workoutType;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}