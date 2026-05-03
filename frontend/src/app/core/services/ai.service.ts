import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Collecte } from './collecte.service';
import { Verger } from './verger.service';
import { LogisticResource } from './logistique.service';
import { environment } from '../../../environments/environment';

import { GoogleGenerativeAI } from '@google/generative-ai';

/** Réponse structurée : liste + justification globale de la sélection. */
export interface AiLogisticsResult {
  resources: {
    resourceId: string;
    resourceName: string;
    quantity: number;
    justification?: string;
  }[];
  selectionJustification: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly geminiModelId = 'gemini-1.5-flash';

  suggestLogistics(
    mission: Collecte,
    verger: Verger,
    inventory: LogisticResource[]
  ): Observable<AiLogisticsResult> {
    return new Observable(observer => {
      const promptText = `
You are an expert agricultural logistics planner specialized in olive harvesting operations.

Your task is to determine the optimal set of resources required to complete a harvesting mission efficiently and at the lowest possible cost.

---

VERGER DATA:
- Name: ${verger.nom}
- Location: ${verger.localisation}
- Number of trees: ${verger.nombreArbres}
- Olive type: ${verger.typeOlive}
- Maturity level: ${verger.niveauMaturite} (0-100)
- Status: ${verger.statut}

---

COLLECTE DATA:
- Mission type: ${mission.type}
- Start date: ${mission.startDate}
- End date: ${mission.endDate}
- Number of workers: ${mission.numberOfWorkers || 'Unknown'}
- Description: ${mission.description}

---

AVAILABLE RESOURCES (INVENTORY):
${JSON.stringify(inventory.map(item => ({
   id: item.id,
   name: item.name,
   type: item.type,
   costPerHour: item.pricePerHour,
   stockLevel: item.stockLevel
})), null, 2)}

---

CONSTRAINTS:
- Do NOT exceed available stockLevel
- Ensure all necessary equipment for olive harvesting is included
- Use realistic agricultural assumptions:
  - 1 harvest net covers ~5 trees
  - 1 electric harvester handles ~20 trees/hour
  - 1 tractor is required for transport if trees > 100
  - Bennes are required for storage and transport
- Adapt equipment based on:
  - number of trees
  - number of workers
  - mission duration

---

OBJECTIVE:
Minimize total cost:
total_cost = SUM(quantity × costPerHour × mission_duration_hours)

AND ensure the mission is feasible and efficient.

---

OUTPUT FORMAT (STRICT JSON ONLY — single object, not an array at root):
{
  "selectionJustification": "3 à 6 phrases en français : pourquoi cet ensemble de matériels est cohérent pour cette mission (verger, durée, effectif, coût, faisabilité).",
  "resources": [
    {
      "resourceId": "string (must match an id from inventory)",
      "resourceName": "string",
      "quantity": 1,
      "justification": "1 à 2 phrases en français : pourquoi ce matériel précis et cette quantité pour cette mission."
    }
  ]
}

DO NOT include any text outside JSON.

Additionally:

- Estimate total workload:
  total_workload = number_of_trees

- Ensure the selected resources can complete the workload within the mission duration.

- If workers are high but tools are low → increase tools
- If trees are very high → prioritize mechanized tools
- If duration is short → increase quantity of equipment

- Avoid over-provisioning (do not suggest excessive unused resources)
`;

      const executeAi = async () => {
        try {
          const apiKey = environment.geminiApiKey?.trim();
          if (!apiKey) {
            observer.error(
              new Error(
                'Clé API Gemini manquante : renseignez `geminiApiKey` dans src/environments/environment.ts (clé depuis Google AI Studio).'
              )
            );
            return;
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: this.geminiModelId });
          const result = await model.generateContent(promptText);
          const response = await result.response;
          const rawText = response.text();
          
          const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonText) as unknown;
          let selectionJustification = '';
          let resources: AiLogisticsResult['resources'];

          if (Array.isArray(parsed)) {
            resources = parsed as AiLogisticsResult['resources'];
          } else if (parsed && typeof parsed === 'object') {
            const o = parsed as Record<string, unknown>;
            selectionJustification = String(o['selectionJustification'] ?? '').trim();
            const raw = o['resources'];
            resources = Array.isArray(raw) ? (raw as AiLogisticsResult['resources']) : [];
          } else {
            throw new Error('Unexpected AI JSON shape');
          }

          observer.next({ resources, selectionJustification });
          observer.complete();
        } catch (error) {
          console.error("[AiService] Google Gemini Official SDK Error:", error);
          observer.error(error);
        }
      };

      executeAi();
    });
  }
}
