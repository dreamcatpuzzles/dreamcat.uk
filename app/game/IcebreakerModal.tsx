"use client";

import { useState } from "react";
import { Button } from "@/app/Button";
import { sensibleQuestions, sillyQuestions } from "@/app/Icebreakers";
import Modal from "@/app/Modal";

type Category = "sensible" | "silly";

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

interface IcebreakerModalProps {
  name: string;
  profilePictureUrl: string;
  onDone: () => void;
}

export default function IcebreakerModal({ name, profilePictureUrl, onDone }: IcebreakerModalProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions] = useState<Record<Category, string[]>>(() => ({
    sensible: shuffle(sensibleQuestions),
    silly: shuffle(sillyQuestions),
  }));

  const title = `You just connected with ${name}!`;
  const list = category ? questions[category] : [];

  return (
    <Modal title={title} onClose={onDone}>
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
        {category === null ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profilePictureUrl}
              alt={name}
              className="aspect-square w-40 rounded-full object-cover"
            />
            <p>Now ask them a:</p>
            <div className="flex flex-col gap-1">
              <Button onClick={() => setCategory("sensible")}>sensible question</Button>
              <Button onClick={() => setCategory("silly")}>silly question</Button>
            </div>
          </>
        ) : (
          <>
            <p>Ask them:</p>
            <p className="text-2xl">{list[questionIndex]}</p>
            <div className="flex flex-col gap-1">
              <Button onClick={onDone}>done!</Button>
              <Button
                theme="secondary"
                onClick={() => setQuestionIndex((index) => (index + 1) % list.length)}
              >
                reroll question
              </Button>
              <Button
                theme="secondary"
                onClick={() => {
                  setCategory(null);
                  setQuestionIndex(0);
                }}
              >
                back
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
