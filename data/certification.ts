import type { Resource } from "@/lib/types";

export const cert = {
  name: "Oracle Certified Professional: Java SE 21 Developer",
  code: "1Z0-830",
  facts: [
    { label: "Questions", value: "50 QCM" },
    { label: "Durée", value: "90 à 120 min" },
    { label: "Score de réussite", value: "68 %" },
    { label: "Prix", value: "245 USD" },
    { label: "Remplace", value: "Java SE 11 (1Z0-819)" },
  ],
  skills: [
    { title: "Fondamentaux & OOP", detail: "types, opérateurs, classes, interfaces, héritage, records, enums, sealed" },
    { title: "Programmation fonctionnelle", detail: "lambdas, interfaces fonctionnelles, Streams, collectors, Optional" },
    { title: "Exceptions & assertions", detail: "try/catch/finally, try-with-resources, exceptions custom, assert" },
    { title: "Collections & génériques", detail: "List/Set/Map/Deque, comparateurs, wildcards, type erasure" },
    { title: "Concurrence", detail: "threads, executors, virtual threads, synchronisation, collections concurrentes" },
    { title: "I/O & JDBC", detail: "java.io, NIO.2, Files/Path, streams, connexion JDBC, transactions" },
  ],
  resources: [
    { title: "OCP Java SE 21 Study Guide — Boyarsky & Selikoff", url: "https://www.selikoff.net/ocp21/", type: "livre", note: "La référence, avec banques de questions." },
    { title: "Oracle University — Java SE 21", url: "https://education.oracle.com/", type: "cours" },
    { title: "Page officielle de l'examen 1Z0-830", url: "https://education.oracle.com/oracle-certified-professional-java-se-21-developer/pexam_1Z0-830", type: "ref", note: "Objectifs détaillés et inscription." },
    { title: "Java SE 21 API Documentation", url: "https://docs.oracle.com/en/java/javase/21/docs/api/", type: "doc", free: true },
  ] as Resource[],
  plan: [
    "S1–S2 : Java 21 moderne (records, sealed, switch patterns) + 300 questions",
    "S3–S4 : lambdas, Streams, collectors, Optional — 200 questions ciblées",
    "S5 : collections, génériques, comparateurs — refaire les exercices du livre",
    "S6 : exceptions, assertions, I/O, NIO.2, JDBC",
    "S7 : concurrence (threads, executors, virtual threads) — le chapitre le plus piégeux",
    "S8 : deux examens blancs chronométrés, révision des erreurs uniquement",
  ],
  tips: [
    "Le piège n'est pas la syntaxe mais les cas limites : lis l'énoncé deux fois.",
    "Code chaque notion dans un main() : la mémoire motrice bat la relecture.",
    "Note chaque erreur dans un carnet ; à J-3, tu ne relis que ce carnet.",
    "Vise 80 % aux examens blancs avant de réserver : 68 % est un seuil, pas un objectif.",
  ],
};

export const foundations: { title: string; why: string; resources: Resource[] }[] = [
  {
    title: "Structures de données & algorithmes",
    why: "20 min par jour, tous les jours : c'est ce qui rend les entretiens et le code quotidien plus faciles.",
    resources: [
      { title: "DSA — abhishektripathi66", url: "https://github.com/abhishektripathi66/DSA", type: "pratique", free: true },
      { title: "NeetCode — Roadmap", url: "https://neetcode.io/roadmap", type: "pratique", free: true },
      { title: "Big-O Cheat Sheet", url: "https://www.bigocheatsheet.com/", type: "ref", free: true },
    ],
  },
  {
    title: "Réseau, TCP/IP, sockets",
    why: "Comprendre ce qui se passe sous HTTP évite des heures de mystère en production.",
    resources: [
      { title: "Networking Fundamentals — Lesson 1a (Practical Networking)", url: "https://youtu.be/bj-Yfakjllc", type: "video", free: true },
      { title: "Real Python — Python Sockets", url: "https://realpython.com/python-sockets/", type: "pratique", free: true },
      { title: "Beej's Guide to Network Programming", url: "https://beej.us/guide/bgnet/", type: "livre", free: true },
    ],
  },
  {
    title: "Culture backend",
    why: "Les lectures longues qui changent la façon de concevoir.",
    resources: [
      { title: "The Twelve-Factor App", url: "https://12factor.net/", type: "doc", free: true },
      { title: "Google SRE Book", url: "https://sre.google/sre-book/table-of-contents/", type: "livre", free: true },
      { title: "Designing Data-Intensive Applications", url: "https://dataintensive.net/", type: "livre" },
      { title: "roadmap.sh — Backend", url: "https://roadmap.sh/backend", type: "ref", free: true },
    ],
  },
];
