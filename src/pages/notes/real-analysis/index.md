---
title: "Real Analysis"
layout: ../../../layouts/NoteLayout.astro
sidebarItems:
  - { title: "Sequences", href: "#sequences" }
  - { title: "Continuity", href: "#continuity" }
---

## Sequences
A sequence $(a_n)$ is a function from $\mathbb{N}$ to $\mathbb{R}$. We say
$a_n \to L$ if for every $\varepsilon > 0$ there exists $N$ such that
$|a_n - L| < \varepsilon$ whenever $n > N$.

## Continuity
A function $f : \mathbb{R} \to \mathbb{R}$ is continuous at $x_0$ if for every
$\varepsilon > 0$ there exists $\delta > 0$ so that $|x-x_0|<\delta$ implies
$|f(x)-f(x_0)|<\varepsilon$.


