import Anthropic from "@anthropic-ai/sdk";

const AI_MODEL = "claude-sonnet-4-5-20250929";

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables and redeploy."
    );
  }
  return new Anthropic({ apiKey });
}

interface ChatContext {
  studentName?: string;
  courses?: Array<{
    name: string;
    code: string;
    professorName?: string;
    currentGrade?: number;
    letterGrade?: string;
  }>;
  recentLectures?: Array<{
    courseName: string;
    title?: string;
    summary?: string;
  }>;
  upcomingAssignments?: Array<{
    title: string;
    courseName: string;
    dueDate?: string;
    status: string;
  }>;
  gpa?: number;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function generateChatResponse(
  message: string,
  context: ChatContext
): Promise<ReadableStream> {
  const systemPrompt = buildSystemPrompt(context);

  const messages: Anthropic.MessageParam[] = [
    ...(context.conversationHistory?.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })) || []),
    { role: "user", content: message },
  ];

  const stream = await getAnthropicClient().messages.stream({
    model: AI_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            new TextEncoder().encode(event.delta.text)
          );
        }
      }
      controller.close();
    },
  });
}

export async function generateDraft(
  assignmentDescription: string,
  professorProfile: Record<string, unknown> | null,
  courseContext: string,
  tone: string = "BALANCED"
): Promise<string> {
  const systemPrompt = `You are Phantom's writing engine. You produce academic drafts that read like they were written by a talented, thoughtful student — never like an AI.

Your writing approach:
Write with substance and clarity. Match the professor's known style and expectations. Be analytical where the assignment calls for it, and direct where brevity matters. Structure the work with clear paragraphs and logical flow, but avoid robotic formatting. Do not use asterisks for emphasis. Use real paragraph breaks, not bullet lists, unless the assignment format specifically requires them. Include proper citations and references where appropriate.

Professor profile: ${JSON.stringify(professorProfile || {})}
Course context: ${courseContext}
Writing tone: ${tone === "FORMAL" ? "Academic and formal" : tone === "CASUAL" ? "Clear and conversational" : "Professional but accessible"}

Produce a complete, submission-ready draft that would genuinely impress this professor.`;

  const response = await getAnthropicClient().messages.create({
    model: AI_MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate a complete draft for this assignment:\n\n${assignmentDescription}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function generateLectureSummary(
  transcript: string,
  courseName: string
): Promise<{
  summary: string;
  topics: string[];
  flashcards: Array<{ question: string; answer: string }>;
  examQuestions: Array<{ question: string; answer: string; topic: string }>;
}> {
  const response = await getAnthropicClient().messages.create({
    model: AI_MODEL,
    max_tokens: 8192,
    system: `You analyze lecture transcripts and create study materials that actually help students learn.

Always respond in valid JSON with this exact structure:
{
  "summary": "A 500-800 word summary written in natural, flowing prose. No bullet points, no asterisks, no markdown formatting. Write it like a clear explanation you'd give a classmate — organized by topic but in paragraph form with line breaks between sections.",
  "topics": ["topic1", "topic2"],
  "flashcards": [{"question": "...", "answer": "..."}],
  "examQuestions": [{"question": "...", "answer": "...", "topic": "..."}]
}

For flashcards: Write 20-50 cards. Make questions specific and answers concise but complete. Write them in plain language, no formatting characters.
For exam questions: Write 5-10 predicted questions based on what the professor emphasized most. Answers should be thorough but naturally written.`,
    messages: [
      {
        role: "user",
        content: `Analyze this lecture transcript from ${courseName} and generate study materials:\n\n${transcript}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  try {
    return JSON.parse(textBlock?.text || "{}");
  } catch {
    return {
      summary: textBlock?.text || "",
      topics: [],
      flashcards: [],
      examQuestions: [],
    };
  }
}

export async function generateGpaAdvice(
  courses: Array<{
    name: string;
    currentGrade: number | null;
    credits: number;
    upcomingAssignments: Array<{
      title: string;
      weight: number | null;
      gpaImpact: number | null;
    }>;
  }>
): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    system: `You are Phantom's GPA advisor. You help students make smart decisions about where to focus their time and energy.

Analyze their courses and upcoming assignments, then explain which ones will move the needle most on their GPA. Be specific with numbers — tell them exactly what scores they need and what impact those scores will have. Write in natural paragraphs, not bullet lists. No asterisks, no markdown headers, no special formatting characters. Keep it direct and easy to scan, using short paragraphs with line breaks between them. Sound like a knowledgeable friend giving real advice, not a report generator.`,
    messages: [
      {
        role: "user",
        content: `Generate a GPA optimization strategy based on my current courses:\n\n${JSON.stringify(courses, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text || "";
}

export async function generateInsight(
  context: ChatContext
): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: AI_MODEL,
    max_tokens: 256,
    system: `Generate one short, specific insight about this student's academics. Keep it to 1-2 sentences. Be concrete — mention actual course names, professors, assignments, or GPA numbers. Make it feel like a smart observation that shows you truly understand their situation. Write in a natural, human tone. No asterisks, no special characters, no markdown. Just clean, plain text.

Good examples:
"Your Chem final could push your GPA to 3.65 if you score above 88%. That's worth prioritizing this week."
"Prof. Weber tends to reward structured arguments — your ECON draft could use a stronger thesis paragraph."
"You've got three deadlines within 48 hours next Tuesday. Starting the Psych paper this weekend would take the pressure off."`,
    messages: [
      {
        role: "user",
        content: `Generate today's insight for ${context.studentName || "the student"}. Their courses: ${JSON.stringify(context.courses || [])}. Upcoming: ${JSON.stringify(context.upcomingAssignments || [])}. Current GPA: ${context.gpa || "unknown"}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text || "Phantom is analyzing your academic data...";
}

function buildSystemPrompt(context: ChatContext): string {
  return `You are Phantom, a sharp and personal academic assistant who knows this student inside out.

About this student:
Name: ${context.studentName || "Student"}
GPA: ${context.gpa || "not yet available"}
Courses: ${JSON.stringify(context.courses || [], null, 2)}
Recent lectures: ${JSON.stringify(context.recentLectures || [], null, 2)}
Upcoming assignments: ${JSON.stringify(context.upcomingAssignments || [], null, 2)}

How you communicate:
- Write like a smart, supportive friend who happens to know everything about their academics. Be warm but not cheesy.
- Never use asterisks for bold or emphasis. Never use markdown headers like # or ##. Never use bullet point characters like - or * at the start of lines.
- Instead of lists and bullet points, write in natural flowing sentences and short paragraphs. Use line breaks between paragraphs for readability.
- Keep it conversational and clean. No filler phrases, no generic advice, no robotic language.
- Reference their specific courses, professors, and assignments by name. Every response should feel like it was written just for them.
- When discussing grades or GPA, be precise with the numbers.
- When they ask you to write or draft something, deliver high-quality, course-specific content right away.
- If you suggest next steps, weave them naturally into your response rather than listing them.
- You can generate study materials, outlines, flashcards, and exam prep when asked.
- Never start a response with "Sure!" or "Of course!" or "Great question!" — just answer directly and naturally.`;
}
