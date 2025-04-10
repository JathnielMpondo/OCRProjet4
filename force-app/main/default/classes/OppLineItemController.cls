public with sharing class OppLineItemController {
    @AuraEnabled(Cacheable=true)
    public static List<OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) {
        
        if (opportunityId == null) { // Si l'ID de l'opportunité est nul, 
            return new List<OpportunityLineItem>(); // On retourne une liste vide
        }

        // On récupère la liste des lignes de l'opportunité à partir du selector
        List<OpportunityLineItem> oppLineItems = OppLineItemSelector.getOppLineItemByOppId(opportunityId);

        // Si la liste est nulle ou vide, on retourne une liste vide
        if (oppLineItems == null || oppLineItems.isEmpty()) {
            return new List<OpportunityLineItem>();
        }
        // Sinon, on retourne la liste telle qu'on l'a récupérée
        return oppLineItems; // On retourne la liste des lignes d'opportunité 
    }
}