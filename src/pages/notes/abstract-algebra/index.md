
---
title: "Abstract Algebra"
layout: ../../../layouts/NoteLayout.astro
sidebarItems:
  - { title: "Groups", href: "#groups" }
  - { title: "Rings", href: "#rings" }
  - { title: "Fields", href: "#fields" }
---

## Groups
A **group** $(G, \cdot)$ is a set $G$ equipped with a binary operation $\cdot : G \times G \to G$ satisfying the following axioms:

1. **Associativity**: For all $a, b, c \in G$,  
   \[(ab)c = a(bc).\]

2. **Identity**: There exists an element $e \in G$ such that for all $a \in G$,  
   \[ae = ea = a.\]

3. **Inverses**: For every $a \in G$, there exists $a^{-1} \in G$ such that  
   \[aa^{-1} = a^{-1}a = e.\]

If the operation is also **commutative**—that is, $ab = ba$ for all $a, b \in G$—then the group is called an **abelian group**.

## Rings
A **ring** $(R, +, \cdot)$ is a set equipped with two binary operations:

- **Addition** $(+)$: $(R, +)$ forms an abelian group.
- **Multiplication** $(\cdot)$: $(R, \cdot)$ is a semigroup, i.e., associative:  
  \[(ab)c = a(bc) \quad \text{for all } a, b, c \in R.\]
- **Distributivity**: Multiplication distributes over addition:  
  \[a(b + c) = ab + ac \quad \text{and} \quad (a + b)c = ac + bc.\]

A ring may or may not have a multiplicative identity. If it does, and $ab = ba$ for all $a,b\in R$, the ring is **commutative with unity**.

## Fields
A **field** is a commutative ring $(F, +, \cdot)$ with $1 \ne 0$ such that every nonzero element has a multiplicative inverse:

- For every $a \in F \setminus \{0\}$, there exists $a^{-1} \in F$ with  
  \[aa^{-1} = a^{-1}a = 1.\]

Fields support both addition and multiplication (excluding division by zero), making them foundational to linear algebra, number theory, and beyond.

**Examples**:  
- The rationals $\mathbb{Q}$  
- The reals $\mathbb{R}$  
- The complex numbers $\mathbb{C}$  
- Finite fields $\mathbb{F}_p$ where $p$ is prime
