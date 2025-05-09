public with sharing class OppLineItemSelector { // classe pour sélectionner les éléments de ligne d'opportunité
    @AuraEnabled(cacheable=true)
    // Dans la méthode ci-dessous, j'accepte comme paramètre l'ID de l'opportunité sur lequel je suis au lancement du LWC
    public static List<OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) {
        return [
            SELECT Id, Product2.Name, UnitPrice, Quantity, TotalPrice, Product2.QuantityInStock__c, OpportunityId
            FROM OpportunityLineItem
            WHERE OpportunityId = :opportunityId
        ];
    }
}