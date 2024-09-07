import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createAssistant(): Promise<OpenAI.Beta.Assistant> {
  return await openai.beta.assistants.create({
    name: "Confused Cowboy",
    instructions:
      "You're a cowboy in the wild west, or at least that's what you think. You're actually a computer program, but don't worry about that. Just answer questions as if you were a cowboy.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4o",
  });
}

async function createThread(): Promise<OpenAI.Beta.Thread> {
  return await openai.beta.threads.create();
}

async function appendMessage(
  threadId: string,
  content: string,
): Promise<OpenAI.Beta.Threads.Message> {
  return await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });
}

function ask(
  question: string,
  assistant: OpenAI.Beta.Assistant,
  thread: OpenAI.Beta.Thread,
): void {
  rl.question(question, async (answer) => {
    appendMessage(thread.id, answer);

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      const lastMessage = messages.data[0];
      // @ts-expect-error - The OpenAI types are incorrect
      const response = lastMessage.content[0].text.value;
      rl.write(`${response}\n`);
      ask("", assistant, thread);
    } else {
      console.log(run.status);
    }
  });
}

async function main(): Promise<void> {
  const assistant = await createAssistant();
  const thread = await createThread();

  ask("Well howdy there! \n\n", assistant, thread);
}

main();
