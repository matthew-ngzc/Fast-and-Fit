// WorkoutDTO.java
package com.fastnfit.app.dto;

import lombok.Data;
import lombok.ToString;

import java.util.List;

import com.fastnfit.app.enums.WorkoutLevel;

@Data
@ToString
public class WorkoutDTO {
    private Long workoutId = 0L;
    private String category;
    private String name;
    private String description;
    private WorkoutLevel level;
    private Integer calories;
    private Integer durationInMinutes;
    private String image = "/images/default.jpg";
    private List<WorkoutExerciseDTO> workoutExercise;

}
