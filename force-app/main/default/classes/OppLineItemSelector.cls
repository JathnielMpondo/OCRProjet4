public with sharing class OppLineItemSelector {
    public static List <OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) {
        
        List<OpportunityLineItem> oppLineItems = [ // Récupère les lignes d'opportunité associées à l'opportunité.
            SELECT Id, Product2.Name, UnitPrice, TotalPrice, Quantity, Product2.QuantityInStock__c, OpportunityId // Sélectionne les champs de la ligne d'opportunité.
            FROM OpportunityLineItem // Objet de requête.
            WHERE OpportunityId = :opportunityId // Filtre sur l'ID de l'opportunité.
        ];

        return oppLineItems; // Retourne la liste des lignes d'opportunité.  
    }
}