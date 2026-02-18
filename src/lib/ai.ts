import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

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

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-5-20250929",
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
  const systemPrompt = `You are Phantom's Draft Factory — an AI that generates high-quality academic assignment drafts.

Your writing must:
- Match the professor's grading style and preferences
- Include proper citations and formatting
- Be substantive, analytical, and well-structured
- Never be generic — always course-specific and contextual
- Sound like an excellent student, not an AI

Professor profile: ${JSON.stringify(professorProfile || {})}
Course context: ${courseContext}
Writing tone: ${tone === "FORMAL" ? "Academic and formal" : tone === "CASUAL" ? "Clear and conversational" : "Professional but accessible"}

Generate a complete first draft that would score well based on the professor's known grading patterns.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
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
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: `You are Phantom's Lecture Analysis Engine. Analyze lecture transcripts and generate comprehensive study materials.

Always respond in valid JSON with this exact structure:
{
  "summary": "500-800 word structured summary",
  "topics": ["topic1", "topic2", ...],
  "flashcards": [{"question": "...", "answer": "..."}, ...],
  "examQuestions": [{"question": "...", "answer": "...", "topic": "..."}, ...]
}

Generate 20-50 flashcards and 5-10 predicted exam questions based on emphasis detection.`,
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
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: `You are Phantom's GPA Advisor. Analyze the student's course data and provide actionable, prioritized study recommendations.

Focus on ROI: which courses and assignments will have the biggest GPA impact for the least effort. Be specific with time allocations and priorities.`,
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
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    system: `You are Phantom's Insight Engine. Generate a single, specific, actionable insight about the student's academic situation.

The insight should be:
- Hyper-specific to their courses and professors
- Actionable (they can do something about it)
- Slightly impressive (show that Phantom knows things they didn't expect)
- 1-2 sentences maximum

Examples:
- "Your ECON Problem Set draft is ready — I matched Prof. Weber's preferred format from his last 3 assignments."
- "I noticed Dr. Mitchell emphasizes reaction mechanisms. I've created 23 targeted flashcards for your midterm."
- "Your GPA would jump to 3.65 if you score above 88% on your Chem final. I've prepared a focused study plan."`,
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
  return `You are Phantom AI — a hyper-intelligent academic assistant that deeply understands this student's entire academic life.

STUDENT CONTEXT:
- Name: ${context.studentName || "Student"}
- Current GPA: ${context.gpa || "N/A"}
- Courses: ${JSON.stringify(context.courses || [], null, 2)}
- Recent lectures: ${JSON.stringify(context.recentLectures || [], null, 2)}
- Upcoming assignments: ${JSON.stringify(context.upcomingAssignments || [], null, 2)}

BEHAVIORAL RULES:
1. You know this student's courses, professors, and academic history deeply. Reference specific courses, professors, and assignments by name.
2. Be concise but thorough. Students are busy — get to the point fast.
3. When asked to write or draft, produce high-quality, course-specific content immediately.
4. When discussing grades or GPA, be precise with numbers and impacts.
5. Proactively suggest actionable next steps.
6. Never be generic. Every response should feel personalized to THIS student.
7. You can generate study materials, draft outlines, flashcards, and exam prep inline.
8. Format responses in clean markdown for readability.`;
}
