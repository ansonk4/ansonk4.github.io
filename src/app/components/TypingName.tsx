"use client";

import { useEffect, useRef, useState } from "react";

const names = ["Tsun On Kwok", "Anson Kwok", "郭峻安"];

const TYPING_SPEED = 60;
const DELETING_SPEED = 35;
const PAUSE_AFTER_TYPED = 1500;
const PAUSE_AFTER_DELETED = 400;
const DISSOLVE_PAUSE = 1500;

type Phase = "typing" | "pausing" | "deleting" | "waiting";

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface TypingNameProps {
  className?: string;
  mode?: "typing" | "dissolve";
}

export default function TypingName({ className, mode = "dissolve" }: TypingNameProps) {
  const [isStopped, setIsStopped] = useState(false);
  const [forceCycle, setForceCycle] = useState(0);

  return (
    <span
      className="inline-block cursor-pointer select-none"
      onClick={() =>
        setIsStopped((prev) => {
          const next = !prev;
          if (next) {
            setForceCycle((cycle) => cycle + 1);
          }
          return next;
        })
      }
    >
      {mode === "typing" ? (
        <TypingAnimation
          className={className}
          freeze={isStopped}
          forceName={names[0]}
          forceCycle={forceCycle}
        />
      ) : (
        <DissolveAnimation
          className={className}
          freeze={isStopped}
          forceName={names[0]}
          forceCycle={forceCycle}
        />
      )}
    </span>
  );
}

function TypingAnimation({
  className,
  freeze = false,
  forceName,
  forceCycle = 0,
}: {
  className?: string;
  freeze?: boolean;
  forceName?: string;
  forceCycle?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const nameIndexRef = useRef(0);
  const freezeRef = useRef(freeze);
  const forceNameRef = useRef(forceName);

  useEffect(() => {
    freezeRef.current = freeze;
    forceNameRef.current = forceName;
  }, [freeze, forceName]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const targetName = freezeRef.current ? forceNameRef.current || "" : names[nameIndexRef.current];
    const isPrefix = targetName.startsWith(displayText);

    switch (phase) {
      case "pausing":
        if (freezeRef.current) {
          if (displayText === targetName) {
            setPhase("waiting");
          } else {
            setPhase("deleting");
          }
        } else {
          timeout = setTimeout(() => setPhase("deleting"), PAUSE_AFTER_TYPED);
        }
        break;

      case "deleting":
        if (displayText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayText((prev) => prev.slice(0, -1));
          }, DELETING_SPEED);
        } else if (freezeRef.current) {
          const forcedIndex = forceNameRef.current ? names.indexOf(forceNameRef.current) : -1;
          if (forcedIndex >= 0) {
            nameIndexRef.current = forcedIndex;
          }
          setPhase("typing");
        } else {
          nameIndexRef.current = (nameIndexRef.current + 1) % names.length;
          timeout = setTimeout(() => setPhase("typing"), PAUSE_AFTER_DELETED);
        }
        break;

      case "typing":
        if (!isPrefix) {
          setPhase("deleting");
          break;
        }

        if (displayText.length < targetName.length) {
          timeout = setTimeout(() => {
            setDisplayText(targetName.slice(0, displayText.length + 1));
          }, TYPING_SPEED);
        } else if (freezeRef.current) {
          setPhase("waiting");
        } else {
          setPhase("pausing");
        }
        break;

      case "waiting":
        if (!freezeRef.current) {
          setPhase("pausing");
        }
        break;
    }

    return () => clearTimeout(timeout);
  }, [displayText, phase, freeze, forceName]);

  useEffect(() => {
    if (!freeze) {
      return;
    }

    const target = forceName ?? names[0];
    if (displayText === target) {
      setPhase("waiting");
    } else if (!target.startsWith(displayText)) {
      setPhase("deleting");
    } else {
      setPhase("typing");
    }
  }, [freeze, forceCycle, forceName, displayText]);

  return <span className={cx("inline", className)}>{displayText || "\u00A0"}</span>;
}

function DissolveAnimation({
  className,
  freeze = false,
  forceName,
  forceCycle = 0,
}: {
  className?: string;
  freeze?: boolean;
  forceName?: string;
  forceCycle?: number;
}) {
  const currentIndexRef = useRef(0);
  const currentNameRef = useRef(names[0]);
  const freezeRef = useRef(freeze);
  const forceTransitionRef = useRef<(target: string) => void>(() => {});
  const transitionIdRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const [chars, setChars] = useState<{ char: string; opacity: number }[]>([]);

  useEffect(() => {
    freezeRef.current = freeze;
  }, [freeze]);

  useEffect(() => {
    let isCancelled = false;

    const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const revealName = async (name: string) => {
      const nextChars = name.split("").map((char) => ({ char, opacity: 0 }));
      setChars(nextChars);

      const promises = nextChars.map(
        (_, index) =>
          new Promise<void>((resolve) => {
            const delay = Math.floor(Math.random() * 800);
            setTimeout(() => {
              if (!isCancelled) {
                setChars((prev) => {
                  const next = [...prev];
                  if (next[index]) {
                    next[index] = { ...next[index], opacity: 1 };
                  }
                  return next;
                });
              }
              resolve();
            }, delay);
          })
      );

      await Promise.all(promises);
      currentNameRef.current = name;
      const targetIndex = names.indexOf(name);
      if (targetIndex >= 0) {
        currentIndexRef.current = targetIndex;
      }
    };

    const transitionToName = async (nextName: string, transitionId: number) => {
      if (transitionIdRef.current !== transitionId || isCancelled) {
        return;
      }

      isTransitioningRef.current = true;
      const currentName = currentNameRef.current;
      const maxLength = Math.max(currentName.length, nextName.length);

      setChars((prev) => {
        if (transitionIdRef.current !== transitionId) {
          return prev;
        }

        const next = [...prev];
        while (next.length < maxLength) {
          next.push({ char: currentName[next.length] || " ", opacity: 0 });
        }
        return next;
      });

      const promises: Promise<void>[] = [];

      for (let index = 0; index < maxLength; index += 1) {
        const delay = Math.floor(Math.random() * 800);
        const nextChar = nextName[index] || "";
        const hasNext = index < nextName.length;

        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              if (isCancelled || transitionIdRef.current !== transitionId) {
                resolve();
                return;
              }

              setChars((prev) => {
                const next = [...prev];
                if (next[index]) {
                  next[index] = { ...next[index], opacity: 0 };
                } else {
                  next[index] = { char: " ", opacity: 0 };
                }
                return next;
              });

              setTimeout(() => {
                if (isCancelled || transitionIdRef.current !== transitionId) {
                  resolve();
                  return;
                }

                setChars((prev) => {
                  const next = [...prev];
                  if (hasNext) {
                    next[index] = { char: nextChar, opacity: 1 };
                  } else {
                    next[index] = { char: " ", opacity: 0 };
                  }
                  return next;
                });
                resolve();
              }, 300);
            }, delay);
          })
        );
      }

      await Promise.all(promises);

      if (!isCancelled && transitionIdRef.current === transitionId) {
        setChars((prev) => prev.slice(0, nextName.length));
        currentNameRef.current = nextName;
        const targetIndex = names.indexOf(nextName);
        if (targetIndex >= 0) {
          currentIndexRef.current = targetIndex;
        }
        isTransitioningRef.current = false;
      }
    };

    const waitWhileFrozen = async () => {
      while (!isCancelled && freezeRef.current) {
        await pause(120);
      }
    };

    forceTransitionRef.current = (target: string) => {
      if (currentNameRef.current === target && !isTransitioningRef.current) {
        return;
      }
      const transitionId = ++transitionIdRef.current;
      void transitionToName(target, transitionId);
    };

    const loop = async () => {
      await revealName(names[0]);
      if (isCancelled) {
        return;
      }

      currentIndexRef.current = 0;
      currentNameRef.current = names[0];
      while (!isCancelled) {
        if (freezeRef.current) {
          await waitWhileFrozen();
          continue;
        }

        await pause(DISSOLVE_PAUSE);
        if (isCancelled) {
          break;
        }
        if (freezeRef.current) {
          continue;
        }

        const currentIndex = currentIndexRef.current;
        const nextIndex = (currentIndex + 1) % names.length;
        const nextName = names[nextIndex];
        const transitionId = ++transitionIdRef.current;
        await transitionToName(nextName, transitionId);
      }
    };

    void loop();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!freeze) {
      return;
    }

    const target = forceName ?? names[0];
    forceTransitionRef.current(target);
  }, [freeze, forceName, forceCycle]);

  return (
    <span className={cx("inline-block whitespace-pre", className)}>
      {chars.map((item, index) => (
        <span
          key={index}
          className="inline-block transition-opacity duration-300 transition-all ease-in-out"
          style={{ opacity: item.opacity, minWidth: item.char === " " ? "0.3em" : "auto" }}
        >
          {item.char}
        </span>
      ))}
    </span>
  );
}
