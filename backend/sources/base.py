# backend/sources/base.py

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseSource(ABC):
    """
    Contrat de base que chaque source de données doit respecter.
    Toute nouvelle source hérite de cette classe et implémente
    les deux méthodes : fetch() et normalize()
    """

    # Nom de la source — à définir dans chaque sous-classe
    nom: str = "base"

    @abstractmethod
    async def fetch(self) -> List[Dict[Any, Any]]:
        """
        Interroge la source externe et retourne les données BRUTES.
        Chaque source retourne son propre format ici.
        """
        pass

    @abstractmethod
    def normalize(self, data: Dict[Any, Any]) -> Dict[Any, Any]:
        """
        Traduit UN enregistrement brut vers le format universel VeilSec.
        Appelé sur chaque élément retourné par fetch().
        """
        pass

    async def collect(self) -> List[Dict[Any, Any]]:
        """
        Méthode principale appelée par le scheduler.
        Orchestre fetch() + normalize() pour toute la collection.
        """
        print(f" [{self.nom}] Début de la collecte...")

        raw_data = await self.fetch()
        print(f" [{self.nom}] {len(raw_data)} entrées brutes récupérées")

        normalized = []
        for item in raw_data:
            try:
                result = self.normalize(item)
                if result:
                    normalized.append(result)
            except Exception as e:
                print(f"  [{self.nom}] Erreur normalisation : {e}")
                continue

        print(f" [{self.nom}] {len(normalized)} entrées normalisées")
        return normalized

    def _get_criticite(self, score: float) -> str:
        """
        Convertit un score CVSS en niveau de criticité textuel.
        Méthode utilitaire disponible pour toutes les sources.
        """
        if score is None:
            return "INCONNUE"
        if score >= 9.0:
            return "CRITIQUE"
        elif score >= 7.0:
            return "HAUTE"
        elif score >= 4.0:
            return "MOYENNE"
        else:
            return "FAIBLE"