/**
 * trigger — the player is at the base workbench (request §5, §54); outcome
 *   — a compact recipe card per upgrade that the player crafts with one
 *   click, submitting the craft as a gameplay action to the simulation.
 *
 * archetype: controller; also: UI adapter around the simulation
 * owns: the DOM recipe cards shown at the base and the one-click craft
 *   action that writes a `craftRequest` into the controller input.
 * coordinates: the `Simulation` (reads recipes, affordability, ownership)
 *   and the `PlayerController` input (submits the craft action).
 * fails when: none — a disabled craft button simply submits nothing.
 */
import { RECIPES } from '../content/recipes';
import { canCraft } from '../systems/CraftingSystem';
import type { Simulation } from '../sim/Simulation';

export class CraftingMenu {
  private readonly panel: HTMLElement;
  private readonly sim: Simulation;

  constructor(host: HTMLElement, sim: Simulation) {
    this.sim = sim;
    this.panel = document.createElement('div');
    this.panel.className = 'crafting-menu';
    this.panel.style.display = 'none';
    host.appendChild(this.panel);
  }

  update(): void {
    if (!this.sim.isAtBase(this.sim.player.position)) {
      this.panel.style.display = 'none';
      this.panel.replaceChildren();
      return;
    }
    this.panel.style.display = 'block';
    this.render();
  }

  private render(): void {
    const pool = this.sim.combinedPool();
    this.panel.replaceChildren();
    const title = document.createElement('div');
    title.className = 'crafting-title';
    title.textContent = 'Workbench';
    this.panel.appendChild(title);
    for (const recipe of RECIPES) {
      this.panel.appendChild(this.recipeCard(recipe, pool));
    }
  }

  private recipeCard(recipe: (typeof RECIPES)[number], pool: Record<string, number>): HTMLElement {
    const owned = this.sim.player.equipmentIds.includes(recipe.id);
    const affordable = canCraft(pool, recipe);
    const card = document.createElement('div');
    card.className = 'recipe-card';
    const name = document.createElement('div');
    name.className = 'recipe-name';
    name.textContent = recipe.name;
    const effect = document.createElement('div');
    effect.className = 'recipe-effect';
    effect.textContent = recipe.description;
    const cost = document.createElement('div');
    cost.className = 'recipe-cost';
    cost.textContent = Object.entries(recipe.cost)
      .map(([material, count]) => `${count} ${material}`)
      .join(', ') || 'free';
    const button = document.createElement('button');
    button.className = 'recipe-craft';
    button.textContent = owned ? 'Crafted' : affordable ? 'Craft' : 'Needs more';
    button.disabled = owned || !affordable;
    button.addEventListener('click', () => {
      this.sim.controller.input.craftRequest = recipe.id;
    });
    card.appendChild(name);
    card.appendChild(effect);
    card.appendChild(cost);
    card.appendChild(button);
    return card;
  }
}
