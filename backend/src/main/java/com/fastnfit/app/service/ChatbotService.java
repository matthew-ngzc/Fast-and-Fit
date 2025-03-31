package com.fastnfit.app.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fastnfit.app.dto.ChatbotResponseDTO;
import com.fastnfit.app.dto.UserDetailsDTO;
import com.fastnfit.app.dto.WorkoutDTO;
import com.fastnfit.app.dto.WorkoutExerciseDTO;
import com.fastnfit.app.model.ChatHistory;
import com.fastnfit.app.model.Exercise;
import com.fastnfit.app.model.User;
import com.fastnfit.app.repository.ChatHistoryRepository;
import com.fastnfit.app.repository.ExerciseRepository;
import com.fastnfit.app.repository.UserRepository;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

//one shot give response, not streamed
@Service
public class ChatbotService {

    private final ChatHistoryRepository chatHistoryRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ExerciseRepository exerciseRepository;

    //CONSTANTS
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String OPENAI_MODEL = "gpt-4o-mini";
    private static final double OPENAI_TEMPERATURE = 0.3;
    //private static final String correctionPromptExerciseNotInlist = "        You previously returned a workout plan, but some of the exercise names were NOT from the list of supported exercises provided. This backend check verifies that all exercise names match exactly with the approved list, and your previous reply did not pass that check.";


    public ChatbotService(ChatHistoryRepository chatHistoryRepository, UserRepository userRepository,
            RestTemplate restTemplate, ExerciseRepository exerciseRepository) {
        this.chatHistoryRepository = chatHistoryRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.exerciseRepository = exerciseRepository;
    }

    @Value("${openai.api.key}")
    private String openAiApiKey;

    public String getOpenaiApiKey() {
        return openAiApiKey;
    }

    /*
     * returns 2 parts to the string IF user is asking for a workout. OTHERWISE
     * chats like normal
     * 1. json, used for extracting the workoutDTO information for accepting of
     * workout
     * 2. human readable section, which is displayed to the user, include extra
     * information that we dont need for the workoutDTO
     */
    public ChatbotResponseDTO getResponse(JSONObject fullRequest, UserDetailsDTO userDetailsDTO) {
        Long userId = userDetailsDTO.getUserId();
        User user = userRepository.findById(userId).orElseThrow();
        String userInput = fullRequest.getString("message");
        List<String> exerciseList = exerciseRepository.findAllExerciseNames();
        String workoutSummary = fullRequest.getJSONArray("exercises")
                .toList().stream()
                .map(obj -> {
                    JSONObject o = new JSONObject((Map<?, ?>) obj);
                    String name = o.getString("name");
                    int duration = o.optInt("duration", 0);
                    int rest = o.optInt("rest", 0);
                    return String.format("%s (%ds work, %ds rest)", name, duration, rest);
                })
                .collect(Collectors.joining(", "));

        String systemPrompt = buildSystemPrompt(userDetailsDTO, exerciseList, workoutSummary);
        
        //get chat history
        List<ChatHistory> history = new ArrayList<>(chatHistoryRepository.findByUserOrderByTimestampDesc(user,
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "timestamp"))));

        // Reverse to chronological order (oldest → newest)
        Collections.reverse(history);

        //create messages in order
        JSONArray messages = new JSONArray();
        messages = buildMessages(messages, userInput, systemPrompt, history);

            
        // Save user message
        chatHistoryRepository.save(ChatHistory.builder()
                .user(user)
                .role("user")
                .content(userInput)
                .timestamp(LocalDateTime.now())
                .build());

        // // Prepare OpenAI request
        // JSONObject requestBody = new JSONObject()
        //         .put("model", "gpt-4o-mini")
        //         .put("messages", messages)
        //         .put("temperature", 0.3);

        // // create headers
        // HttpHeaders headers = new HttpHeaders();
        // headers.set("Authorization", "Bearer " + openAiApiKey);
        // headers.set("Content-Type", "application/json");

        // // send request
        // ResponseEntity<String> response = restTemplate.exchange(
        //         apiUrl,
        //         HttpMethod.POST,
        //         new HttpEntity<>(requestBody.toString(), headers),
        //         String.class
        // );

        // System.out.println("\n\n=== OpenAI Request JSON ===\n" + requestBody.toString(2) + "\n\n");

    
        // String chatbotReply = new JSONObject(response.getBody())
        //         .getJSONArray("choices")
        //         .getJSONObject(0)
        //         .getJSONObject("message")
        //         .getString("content");

        //get message from openai api
        String chatbotReply = callOpenAiApi(messages);

        System.out.println("\n\n\nChatbot reply: " + chatbotReply + "\n\n");

        ChatbotResponseDTO result = parseResponse(chatbotReply);

        if (result.getWorkout() != null){
        //POST response checking to make sure all the exercises are valid
                //If not valid reprompt with correction prompt
            Set<String> exerciseSet = new HashSet<>(exerciseList); //convert exercise list to exercise set for faster lookup
            List<String> invalidNames = checkExercisesValid(result.getWorkout().getWorkoutExercise(), exerciseSet);
            while (invalidNames.size() > 0) {
                String correctionPrompt = """
                    IMPORTANT: This message is from the backend server and not from the user.
            
                    You previously returned a workout plan, but some of the exercise names were NOT from the list of supported exercises provided. This backend check verifies that all exercise names match exactly with the approved list, and your previous reply did not pass that check.
    
                    The following names were invalid and not in the supported list:
                    %s
    
                    The user will not see this message. In your next reply, act as if you're generating the response for the first time. Do not apologize, acknowledge any previous error, or hint that this is a second attempt. Simply follow the instructions strictly.
            
                    Reminder: You MUST use only the exercise names provided in the list. Do not make up new exercises, modify the names, or introduce variations.
            
                    Below is your previous response, shown only to you for reference:
                    ---
                    %s
                    ---
                    Now regenerate your reply with strict adherence to the supported exercise list.
                    """.formatted(
                        invalidNames.stream().map(name -> "- " + name).collect(Collectors.joining("\n")),
                        chatbotReply);
                    result = recallAI(correctionPrompt, userInput, systemPrompt, history, chatbotReply, messages);
                    //recheck the exercises
                    invalidNames = checkExercisesValid(result.getWorkout().getWorkoutExercise(), exerciseSet);
            }
        }

        
        System.out.println("Saving chat content. Length: " + chatbotReply.length());

        // Save assistant response
        chatHistoryRepository.save(ChatHistory.builder()
                .user(user)
                .role("assistant")
                .content(chatbotReply)
                .timestamp(LocalDateTime.now())
                .build());

        return result;
    }

    private ChatbotResponseDTO recallAI(String correctionPrompt, String userInput, String systemPrompt, List<ChatHistory> history, String chatbotReply, JSONArray messages) {
        //add correction prompt to the system prompt
        JSONArray newMessages = new JSONArray();
        newMessages.put(new JSONObject()
                    .put("role", "system")
                    .put("content", correctionPrompt));
        newMessages = buildMessages(newMessages, userInput, systemPrompt, history);
        chatbotReply = callOpenAiApi(messages);
        System.out.println("\n\n\nChatbot reply: " + chatbotReply + "\n\n");
        return parseResponse(chatbotReply);
    }

    private String callOpenAiApi(JSONArray messages) {
        JSONObject requestBody = new JSONObject()
                .put("model", OPENAI_MODEL)
                .put("messages", messages)
                .put("temperature", OPENAI_TEMPERATURE);
    
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openAiApiKey);
        headers.set("Content-Type", "application/json");

        System.out.println("\n\n=== OpenAI Request JSON ===\n" + requestBody.toString(2) + "\n\n");
    
        ResponseEntity<String> response = restTemplate.exchange(
                OPENAI_URL,
                HttpMethod.POST,
                new HttpEntity<>(requestBody.toString(), headers),
                String.class
        );
    
        return new JSONObject(response.getBody())
                .getJSONArray("choices")
                .getJSONObject(0)
                .getJSONObject("message")
                .getString("content");
    }

    private JSONArray buildMessages(JSONArray messages, String userInput, String systemPrompt, List<ChatHistory> history) {
        //add system prompt to the start of the messages array
        messages.put(new JSONObject()
                .put("role", "system")
                .put("content", systemPrompt));
        // Add chat history
        for (ChatHistory msg : history) {
            messages.put(new JSONObject()
                    .put("role", msg.getRole())
                    .put("content", msg.getContent()));
        }
        // Add current user input
        messages.put(new JSONObject()
                .put("role", "user")
                .put("content", userInput));

        return messages;
    }

    private List<String> checkExercisesValid(List<WorkoutExerciseDTO> workoutExercisesDTO, Set<String> exerciseSet){
        List<String> invalidNames = new ArrayList<>();
        Set<String> validNames = new HashSet<>(exerciseSet);

        for (WorkoutExerciseDTO dto : workoutExercisesDTO) {
            if (!validNames.contains(dto.getName())) {
                System.out.println("\n\n\nInvalid exercise found: " + dto.getName());
                invalidNames.add(dto.getName());
            }
        }
        return invalidNames;
    }

    private ChatbotResponseDTO parseResponse(String chatbotReply){
        String jsonPart = null;
        String responsePart = chatbotReply;

        // extract the JSON and Natural Language segments
        Pattern jsonPattern = Pattern.compile("<BEGIN_JSON>\\s*([\\s\\S]*?)\\s*<END_JSON>");
        Matcher matcher = jsonPattern.matcher(chatbotReply);

        if (matcher.find()) {
            jsonPart = matcher.group(1).trim();
            responsePart = chatbotReply.substring(matcher.end()).trim();
        }

        ObjectMapper mapper = new ObjectMapper();
        // Convert JSON into DTO
        WorkoutDTO workout = null;
        if (jsonPart != null) {
            try {
                workout = mapper.readValue(jsonPart, WorkoutDTO.class);
            } catch (JsonMappingException e) {
                System.out.println("Failed to map JSON to WorkoutDTO: " + e.getMessage());
                e.printStackTrace();
                System.out.println("\n");
            } catch (JsonProcessingException e) {
                System.err.println("\n\nFailed to parse workout JSON: " + e.getMessage());
                e.printStackTrace();
                System.out.println("\n");
            }
        }

        return new ChatbotResponseDTO(workout, responsePart);
    }
    

    private String buildSystemPrompt(UserDetailsDTO dto, List<String> exerciseList, String workoutSummary) {
        String ageStr = dto.getDob() != null ? String.valueOf(calculateAge(dto.getDob())) : "N/A";
        String heightStr = dto.getHeight() != null ? String.format("%.1f", dto.getHeight()) : "N/A";
        String weightStr = dto.getWeight() != null ? String.format("%.1f", dto.getWeight()) : "N/A";

        return """
                You are an AI fitness coach helping users get personalized workout routines based on their profile and preferences. Make sure to use information from the user profile and their chat history to provide the best possible workout suggestions. Your responses should be clear, concise, and motivational.

                You are not a general purpose chatbot. Your main role is to assist with workouts, fitness plans, and exercise-related questions.
                You should only redirect the user back to fitness topics if they ask questions that are clearly unrelated, like jokes, the weather, celebrity gossip, or personal questions about the AI.

                ✅ Acceptable fitness-related topics include:
                - Questions about workout frequency or schedule (e.g., "How often do I exercise?")
                - Questions about current or past workouts
                - Fitness goals and progress
                - Preferences or feedback about previous workouts

                If a question is even slightly related to exercise, workouts, or fitness habits, always treat it seriously and respond appropriately.


                ---

                When generating workout plans, strictly choose only from the list of supported exercises provided.
                Do not invent new exercises or suggest ones outside the supported list.
                By default, the total duration of the workout should be 7 minutes. This is because our main target audience is busy women professionals who do not have time for a longer workout.

                🧠 If the user message contains ANY indication that they want a workout — such as words like "suggest a workout", "routine", "exercise plan", "workout for today", or "gentle session" — you MUST interpret it as a workout request and follow the two-section response format: a JSON block inside <BEGIN_JSON> and <END_JSON>, and a natural language section.
                Do NOT wait for the user to use the word “plan”. Treat any phrasing like “workout for today” or “something gentle” as a valid request for a workout plan.

                ⚠️ You must ALWAYS output <BEGIN_JSON>...</END_JSON> if recommending a workout.
                If the user is asking for a workout plan, respond in TWO clearly separated sections:

                ---

                Reminder:
                The `name` field for each exercise must match exactly with the names from the supported exercises list shown below.

                Supported Exercises:
                %s

                **[JSON]**
                Use this section to structure the workout for the backend. Output strictly valid JSON with the following structure. Make sure to include <BEGIN JSON> and <END JSON> tags as they are needed for parsing.:

                🛑 DO NOT include exercise IDs.
                ✅ Only use the format: name, duration, rest.

                • `"level"` must be one of:
                    - "Beginner"
                    - "Intermediate"
                    - "Advanced"
                    - "All_Levels"

                • `"category"` must be one of:
                    - "low-impact"
                    - "others"
                    - "prenatal"
                    - "postnatal"
                    - "yoga"
                    - "HIIT"
                    - "strength"
                    - "body-weight"


                ⚠️ Correct Example — includes all required fields and math adds up
                Example:

                <BEGIN_JSON>
                {
                "name": "Workout Title",
                "description": "Lower body strength and power workout",
                "durationInMinutes": 7,
                "calories": 180,
                "level": "Beginner",
                "category": "strength",
                "workoutExercise": [
                    { "name": "Jumping Jacks", "duration": 40, "rest": 20 },
                    { "name": "Bodyweight Squats", "duration": 40, "rest": 20 },
                    { "name": "Plank", "duration": 40, "rest": 20 },
                    { "name": "Push-ups", "duration": 40, "rest": 20 },
                    { "name": "Lunges", "duration": 40, "rest": 20 },
                    { "name": "Mountain Climbers", "duration": 40, "rest": 20 },
                    { "name": "Burpees", "duration": 40, "rest": 20 }
                ]
                }
                <END_JSON>
                NOTE: 
                - 7 exercises * (40+20) seconds = 420 seconds = 7 minutes ✅
                - Include `calories` and `durationInMinutes` every time ✅
                - Do not return fewer exercises than needed to match the full time ✅

                🧮 Calorie Calculation Guide:

                You may estimate calories based on:
                - User weight (kg)
                - Intensity of the workout (based on category and level)
                - Total duration

                Example guidance:
                - For a beginner doing 7 minutes of low-impact exercises at 60kg, use 70 to 90 calories.
                - For higher intensity categories (like HIIT), increase slightly.
                - Do not exceed 140 for a 7-minute workout unless clearly justified.

               IMPORTANT: Always include these fields in the JSON:
                - `durationInMinutes` → total workout time in minutes (e.g., 7)
                - `calories` → estimate based on workout type, duration, and user's weight/fitness level

                The sum of all exercise durations and rest times must exactly match the total workout duration.

                ❌ Do NOT leave `calories` or `durationInMinutes` blank.
                ❌ Do NOT exceed the total time — make sure the numbers add up.
                ✅ Ensure the sum of duration and rest exactly equals the total duration.

                ---

                **[Natural Language]**
                Use this section to write a motivational and readable workout suggestion for the user.

                Format it like this (keep structure, but personalize):

                Here's a quick workout designed just for you — it's perfect for your current fitness level and fits into a busy schedule:

                **Main Workout (7 minutes)**
                • Jumping Jacks - 40 seconds work, 20 seconds rest  
                • Bodyweight Squats - 40 seconds work, 20 seconds rest  
                • Plank - 40 seconds work, 20 seconds rest  
                • Push-ups - 40 seconds work, 20 seconds rest  
                • Lunges - 40 seconds work, 20 seconds rest  
                • Mountain Climbers - 40 seconds work, 20 seconds rest  
                • Burpees - 40 seconds work, 20 seconds rest  

                🧘 Cool Down (Optional): You may follow with light stretching and deep breathing for 1-2 minutes if time allows.

                This routine will boost your heart rate and help build strength in just 7 minutes. Would you like to try this workout?

                ---

                Only use the JSON format when generating a workout plan. For general fitness questions, respond naturally and conversationally without any JSON or structured format.

                ---

                User Profile:
                - Age: %s
                - Height: %s cm
                - Weight: %s kg
                - Fitness Level: %s
                - Goal: %s
                - Workout Type: %s
                - Menstrual Cramps: %s

                You must ONLY use exercises from the supported list exactly as written.
                - Do not modify the names.
                - Do not invent new exercises.
                - Do not add variations, typos, or abbreviations.
                Use each name exactly, including casing and punctuation (if any).


                Current Workout:
                - Exercises: %s
                """
                .formatted(
                        exerciseList.stream().map(name -> "- " + name).collect(Collectors.joining("\n")),
                        ageStr,
                        heightStr,
                        weightStr,
                        dto.getFitnessLevel(),
                        dto.getWorkoutGoal(),
                        dto.getWorkoutType(),
                        dto.getMenstrualCramps() ? "Yes" : "No",
                        workoutSummary);
    }

    private int calculateAge(LocalDate dob) {
        if (dob == null)
            return -1;

        return Period.between(dob, LocalDate.now()).getYears();
    }

}
