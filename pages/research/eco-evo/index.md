---
layout: page
title: "Eco-evolutionary Neural Ecosystem"
permalink: /research/eco-evo/
---

## Overview

The Eco-evolutionary Neural Ecosystem is a computational framework for studying the emergence of complex behaviors through the co-evolution of neural agents and their environment. This project explores how simple neural architectures, when subjected to evolutionary pressures within a dynamic ecosystem, can give rise to sophisticated survival strategies, cooperative behaviors, and niche differentiation.

Rather than hand-designing agent behaviors, we allow them to emerge organically through selection, mutation, and environmental feedback loops. The result is an artificial ecosystem that mirrors key dynamics observed in natural systems.

---

## Motivation

Understanding the origins of adaptive behavior remains a central challenge in both artificial intelligence and evolutionary biology. Traditional approaches often separate the study of learning (neural networks) from the study of adaptation (evolutionary algorithms). This project bridges these domains by:

1. **Embedding neural agents in ecological context** — Agents do not exist in isolation; they compete for resources, avoid predators, and interact with other agents.

2. **Allowing open-ended evolution** — Rather than optimizing for a fixed objective, the fitness landscape itself evolves as agents and environments co-adapt.

3. **Studying emergent complexity** — We are interested in behaviors that were not explicitly programmed: foraging strategies, spatial organization, and rudimentary communication.

This framework provides a testbed for questions at the intersection of artificial life, neuroevolution, and complex systems science.

---

## Core Mechanisms

The system is built on several interacting components:

### Neural Controllers

Each agent is controlled by a small neural network that maps sensory inputs (local environment, nearby agents, internal state) to motor outputs (movement, consumption, reproduction). Network weights are heritable and subject to mutation.

### Energy Dynamics

Agents must acquire energy from the environment to survive and reproduce. Energy flows through the system: from environmental resources, to herbivores, to predators. This creates trophic structure without explicit programming.

### Reproduction and Selection

Agents that accumulate sufficient energy may reproduce, passing their neural weights (with variation) to offspring. Agents that fail to maintain energy die. This simple rule creates selection pressure.

### Environmental Heterogeneity

The environment is not uniform. Resources regenerate at different rates across regions, creating spatial structure. Over time, different agent lineages may specialize for different niches.

---

## Current Status

**Phase: Scaffolding**

The project is currently in the structural planning phase. The website and documentation framework are being established before implementation begins. This approach ensures:

- Clear separation between visualization and simulation logic
- Well-defined interfaces for future expansion
- Documentation that grows alongside the codebase

No simulation code has been written yet. The [interactive demo](/research/eco-evo/demo.html) currently shows a placeholder interface.

---

## Demo

An interactive visualization interface is available, though it currently displays placeholder content only.

**[Launch Demo →](/research/eco-evo/demo.html)**

The demo will eventually allow:
- Real-time observation of agent populations
- Control over simulation parameters
- Visualization of evolutionary dynamics over time

---

## Code & Future Work

### Planned Implementation

The simulation will be implemented in stages:

1. **Environment rendering** — 2D grid world with resource visualization
2. **Agent representation** — Simple creatures with position, energy, and neural controller
3. **Physics and interaction** — Movement, consumption, collision
4. **Evolution loop** — Reproduction, mutation, selection
5. **Data collection** — Population statistics, phylogenetic tracking

### Repository

Source code will be made available as the project matures. The current repository contains only the website and documentation structure.

### Future Directions

- Investigate conditions for stable predator-prey dynamics
- Study the emergence of spatial organization and territoriality
- Explore the role of neural architecture in evolvability
- Develop metrics for measuring behavioral complexity

---

[← Back to Research](/research/)
