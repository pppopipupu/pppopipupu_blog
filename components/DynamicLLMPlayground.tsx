import dynamic from "next/dynamic";

const DynamicLLMPlayground = dynamic(
  () => import("./llm-playground/LLMPlayground"),
  { ssr: false }
);

export default DynamicLLMPlayground;
