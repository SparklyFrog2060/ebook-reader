import fetch from "node-fetch";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    // Usunięcie powtarzających się fraz
    const cleanedText = text.replace(/(\b\w+\b)(?=.*\b\1\b)/gi, "").trim();

    // Skracanie tekstu do maks. 300 znaków
    const truncatedText = cleanedText.length > 300 ? cleanedText.slice(0, 300) + "..." : cleanedText;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: truncatedText }),
      }
    );

    const result = await response.json();

    // Debugowanie odpowiedzi z Hugging Face
    console.log("Hugging Face API Response:", result);

    // Sprawdzenie formatu odpowiedzi
    if (!Array.isArray(result) || result.length === 0 || !Array.isArray(result[0])) {
      throw new Error("Unexpected API response format");
    }

    // Pobranie wyników i wprowadzenie korekty dla "sadness"
    const SADNESS_FACTOR = 0.5; // Zmniejszamy wagę "sadness" o 50% (opcjonalnie, możesz zmienić na 1, by nie zmieniać wagi)
    const emotions = result[0].map((emotion) => {
      if (emotion.label.toLowerCase() === "sadness") {
        return { ...emotion, score: emotion.score * SADNESS_FACTOR };
      }
      return emotion;
    });

    // Sortujemy emocje według score (od najwyższego do najniższego)
    const sortedResults = emotions.sort((a, b) => b.score - a.score);

    // Wybieramy emocję o najwyższym score
    const topEmotion = sortedResults[0]; // Najwyższy wynik

    if (!topEmotion) {
      throw new Error("No valid emotions found");
    }

    // Finalna odpowiedź
    res.status(200).json({
      mood: topEmotion.label.toLowerCase(),
      confidence: topEmotion.score,
      originalText: text,
      cleanedText,
      truncatedText,
    });
  } catch (error) {
    console.error("Hugging Face Error:", error.message || error);
    res.status(500).json({ message: "Error analyzing text", error: error.message || error });
  }
}
