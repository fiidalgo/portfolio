---
title: "Real Analysis"
layout: ../../../layouts/NoteLayout.astro
sidebarItems:
  - { title: "Sequences", href: "#sequences" }
  - { title: "Continuity", href: "#continuity" }
  - { title: "Differentiation", href: "#differentiation" }
---

## Sequences
A sequence $(a_n)$ is a function from $\mathbb{N}$ to $\mathbb{R}$. We say
$a_n \to L$ if for every $\varepsilon > 0$ there exists $N$ such that
$|a_n - L| < \varepsilon$ whenever $n > N$.

## Continuity
A function $f : \mathbb{R} \to \mathbb{R}$ is continuous at $x_0$ if for every
$\varepsilon > 0$ there exists $\delta > 0$ so that $|x-x_0|<\delta$ implies
$|f(x)-f(x_0)|<\varepsilon$.

## Differentiation
The derivative of $f$ at $x_0$ is defined by
\[f'(x_0) = \lim_{h \to 0} \frac{f(x_0+h)-f(x_0)}{h}.\]

