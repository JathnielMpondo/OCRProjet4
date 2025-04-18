public with sharing class OppLineItemSelector {
    @AuraEnabled(cacheable=true)
    public static List<OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) {
        return [
            SELECT Id, Product2.Name, UnitPrice, Quantity, TotalPrice, Product2.QuantityInStock__c, OpportunityId
            FROM OpportunityLineItem
            WHERE OpportunityId = :opportunityId
        ];
    }
}