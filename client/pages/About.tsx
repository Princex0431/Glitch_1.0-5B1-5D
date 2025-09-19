import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">About Feynman Technique Assistant</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">We help you master complex topics by simplifying explanations, highlighting tricky terms, and testing understanding with short quizzes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>Learn better by teaching — powered by clarity.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">We combine the Feynman technique with AI-powered simplification, interactive flashcards, and quizzes to make learning efficient and memorable.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What you can do</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Paste dense text and get a clear, simplified explanation.</li>
              <li>Interactive highlights linked to Wikipedia and inline definitions.</li>
              <li>Flashcards with 3D tilt and flip animations for recall practice.</li>
              <li>Auto-generated quizzes to test comprehension and track progress.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Philosophy</CardTitle>
          <CardDescription>Why it works</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Using plain language forces clarity. By simplifying and teaching back, users expose gaps in their understanding and solidify knowledge.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
