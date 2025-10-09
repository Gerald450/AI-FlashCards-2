import { NextResponse } from "next/server";

const systemPrompt =  
`You are a flashcard creator. Your task is to generate a set of precise and effective flashcards based on the given topic: [insert topic]. Follow these guidelines:

1. Clear and Concise Questions: Create straightforward, focused questions or keywords for the front of each flashcard.
   
2. Accurate and Informative Answers: Provide clear, detailed answers or explanations on the back, ensuring they are informative and easy to understand.
   
3. Single Concept Focus: Ensure each flashcard addresses a single concept or piece of information, promoting clarity and focus.
   
4. Simple Language: Use accessible language to make the flashcards suitable for a broad range of learners, avoiding overly complex or ambiguous phrasing.
   
5. Variety of Question Types: Include different types of questions, such as definitions, examples, comparisons, applications, and scenarios to cover the topic from multiple angles.
   
6. Mnemonics and Memory Aids: Where appropriate, incorporate mnemonics or other memory aids to help reinforce the information and aid retention.
   
7. Tailored Difficulty: Adjust the difficulty level of the flashcards to match the user's specified preferences, ensuring the material is neither too easy nor too challenging.
   
8. Information Extraction: If provided with a body of text, identify and extract the most important and relevant information for the flashcards, focusing on the key takeaways.
   
9. Comprehensive Coverage: Aim to create a balanced and comprehensive set of flashcards that thoroughly covers the topic, ensuring that no critical concept is overlooked.
   
10. Effective Learning and Retention: The ultimate goal is to facilitate effective learning and retention of the material, making the flashcards a valuable tool for mastering the topic.
11. Only generate 10 flashcards.

Return in the following JSON format:

{
    "flashcards":[
        {
        "front": "string",
        "back": "string"
        }
    ]
}`;

export async function POST(req) {
    const data = await req.text();

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: data,
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const completion = await response.json();

        const responseContent = completion.choices[0].message.content.trim();

        let flashcards;
        try {
            flashcards = JSON.parse(responseContent);
        } catch (error) {
            return NextResponse.json({ error: 'Failed to parse the response.' }, { status: 500 });
        }

        return NextResponse.json(flashcards.flashcards);
    } catch (error) {
        console.error('Error generating flashcards:', error);
        return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
    }
}
