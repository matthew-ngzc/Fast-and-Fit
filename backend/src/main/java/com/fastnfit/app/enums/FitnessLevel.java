package com.fastnfit.app.enums;

public enum FitnessLevel {
    Beginner("BEGINNER"), Intermediate("INTERMEDIATE"), Advanced("ADVANCED");

    private final String value;

    FitnessLevel(String value){
        this.value=value;
    }

    public String getValue() {
        return value;
    }

    public static FitnessLevel fromValue(String value) {
        for (FitnessLevel level : values()) {
            if (level.value.equalsIgnoreCase(value)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Invalid fitness level: " + value);
    }
}
