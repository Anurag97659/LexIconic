import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Word } from "../models/word.model.js";
import { User } from "../models/user.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const createWord = asyncHandler(async (req, res) => {
  const { word } = req.body;
  const userId = req.user._id;

  if (!word || word.trim() === "") {
    throw new ApiError(400, "Word is required");
  }

  const cleanWord = word.trim().toLowerCase();

  // Check if word already exists in the database
  const existingWord = await Word.findOne({ word: cleanWord });
  if (existingWord) {
    throw new ApiError(409, "Word already exists in the database");
  }

  // Verify Gemini API key is configured
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "GEMINI_API_KEY is not configured in backend environment variables");
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash which is fast and supports JSON schema output
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Generate a vocabulary dictionary entry for the English word "${cleanWord}". 
Return a JSON object matching this exact structure:
{
  "definitions": [
    {
      "partOfSpeech": "noun" (or "adverb", "adjective", "verb", etc.),
      "definition": "Clear Google-style definition"
    }
  ],
  "synonyms": ["up to 5 synonyms"],
  "antonyms": ["up to 5 antonyms"],
  "examples": ["exactly 3 sentence examples showing usage of the word"]
}

Provide definitions for different parts of speech if applicable (e.g. noun, adjective, adverb). Ensure all list fields are array of strings. Do not include any markdown styling like \`\`\`json. Return only the JSON object.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let generatedData;
    try {
      generatedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Gemini raw response:", responseText);
      console.error("Parse error details:", parseError);
      throw new ApiError(500, "Failed to parse dictionary response from Gemini");
    }

    if (!generatedData.definitions || !Array.isArray(generatedData.definitions)) {
      throw new ApiError(500, "Invalid definitions format returned from Gemini");
    }

    const newWord = await Word.create({
      word: cleanWord,
      definitions: generatedData.definitions,
      synonyms: generatedData.synonyms || [],
      antonyms: generatedData.antonyms || [],
      examples: generatedData.examples || [],
      createdBy: userId
    });

    res.status(201).json(new ApiResponse(201, newWord, "Word created successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Error generating word details via Gemini: ${error.message}`);
  }
});

const getWords = asyncHandler(async (req, res) => {
  const words = await Word.find().populate("createdBy", "username fullname");
  res.status(200).json(new ApiResponse(200, words, "Words retrieved successfully"));
});

const getWordById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const word = await Word.findById(id).populate("createdBy", "username fullname");

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  res.status(200).json(new ApiResponse(200, word, "Word retrieved successfully"));
});

const updateWord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { word, definitions, examples, synonyms, antonyms } = req.body;

  const updatedWord = await Word.findByIdAndUpdate(
    id,
    { word, definitions, examples, synonyms, antonyms },
    { new: true }
  );

  if (!updatedWord) {
    throw new ApiError(404, "Word not found");
  }

  res.status(200).json(new ApiResponse(200, updatedWord, "Word updated successfully"));
});

const deleteWord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const word = await Word.findById(id);

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  if (word.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this word");
  }

  await Word.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, word, "Word deleted successfully"));
});

const searchWords = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Query parameter is required");
  }

  const words = await Word.find().populate("createdBy", "username fullname");

  if (words.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No words in database"));
  }

  const compactWords = words.map(w => ({
    id: w._id.toString(),
    word: w.word,
    definitions: w.definitions.map(d => `${d.partOfSpeech}: ${d.definition}`),
    synonyms: w.synonyms,
    antonyms: w.antonyms
  }));

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are a semantic search engine for a user's vocabulary list.
Find the words in the vocabulary bank that are semantically related or match the user query.
Sort the matches by relevance.

User Search Query: "${q}"

Vocabulary Bank:
${JSON.stringify(compactWords)}

Return a JSON array of matching word IDs (strings) from the vocabulary bank. If no words are related, return an empty array []. Do not include markdown styling like \`\`\`json.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let matchedIds = [];
    try {
      matchedIds = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse search matches:", responseText, parseError);
    }

    if (!Array.isArray(matchedIds)) {
      matchedIds = [];
    }

    const matchedWords = matchedIds
      .map(id => words.find(w => w._id.toString() === id))
      .filter(Boolean);

    res.status(200).json(new ApiResponse(200, matchedWords, "Semantic search completed"));
  } catch (error) {
    console.error("Semantic search failed:", error);
    const query = q.toLowerCase();
    const fallbackWords = words.filter(item => {
      const wordMatch = item.word.toLowerCase().includes(query);
      const definitionMatch = item.definitions.some(d =>
        d.definition.toLowerCase().includes(query)
      );
      const posMatch = item.definitions.some(d =>
        d.partOfSpeech.toLowerCase().includes(query)
      );
      return wordMatch || definitionMatch || posMatch;
    });
    res.status(200).json(new ApiResponse(200, fallbackWords, "Semantic search fallback completed"));
  }
});

export {
  createWord,
  getWords,
  getWordById,
  updateWord,
  deleteWord,
  searchWords
};