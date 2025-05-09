public with sharing class OppLineItemController { // classe pour gérer les éléments de ligne d'opportunité

    @AuraEnabled(cacheable=true)
    public static List<OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) { // méthode pour récupérer les éléments de ligne d'opportunité en fonction de l'Id de l'opportunité 
        if (opportunityId == null) {
            return new List<OpportunityLineItem>();
        }

        List<OpportunityLineItem> oppLineItems = OppLineItemSelector.getOppLineItemByOppId(opportunityId); // récupère les éléments de ligne d'opportunité en fonction de l'Id de l'opportunité 

        if (oppLineItems == null || oppLineItems.isEmpty()) { // vérifie si la liste est vide ou nulle 
            return new List<OpportunityLineItem>();
        }
        return oppLineItems;
    }

    @AuraEnabled
    public static void deleteOpportunityLineItem(Id lineItemId) { // méthode pour supprimer un élément de ligne d'opportunité 
        if (lineItemId == null) return;

        OpportunityLineItem item = [SELECT Id FROM OpportunityLineItem WHERE Id = :lineItemId LIMIT 1]; // récupère l'élément de ligne d'opportunité dont l'Id est lineItemId 
        delete item;
    }
}