package com.fastnfit.app.controller;

import com.fastnfit.app.dto.ChatbotResponseDTO;
import com.fastnfit.app.dto.UserDetailsDTO;
import com.fastnfit.app.dto.WorkoutDTO;
import com.fastnfit.app.service.UserService;
import com.fastnfit.app.service.ChatbotService;
import com.fastnfit.app.service.WorkoutService;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private UserService userService;

    @Autowired
    private ChatbotService chatbotService;

    @Autowired
    private WorkoutService workoutService;

    // @PostMapping("/{userId}")
    // public ResponseEntity<String> chat(
    //         @PathVariable Long userId,
    //         @RequestBody Map<String, Object> payload
    // ) {
    //     try {
    //         UserDetailsDTO userDetails = userService.getUserDetails(userId);
    //         JSONObject request = new JSONObject(payload);
    //         String response = chatbotService.getResponse(request, userDetails);
    //         return ResponseEntity.ok(response);
    //     } catch (Exception e) {
    //         return ResponseEntity.status(500).body("Failed to process chatbot message.");
    //     }
    // }

    @PostMapping("/{userId}")
    public ResponseEntity<ChatbotResponseDTO> chat(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            UserDetailsDTO userDetails = userService.getUserDetails(userId);
            JSONObject request = new JSONObject(payload);
            ChatbotResponseDTO response = chatbotService.getResponse(request, userDetails);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Error in ChatbotController: " + e.getMessage());
            System.out.println(e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }


    // Accept AI-generated workout endpoint
    @PostMapping("/{userId}/accept")
    public ResponseEntity<WorkoutDTO> acceptAIWorkoutFromChat(
            @PathVariable Long userId,
            @RequestBody WorkoutDTO aiWorkout
    ) {
        try {
            WorkoutDTO savedWorkout = workoutService.saveCustomWorkoutForUser(aiWorkout);
            return ResponseEntity.ok(savedWorkout);
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

}
