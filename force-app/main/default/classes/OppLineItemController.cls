public with sharing class OppLineItemController {

    @AuraEnabled(cacheable=true)
    public static List<OpportunityLineItem> getOppLineItemByOppId(Id opportunityId) {
        if (opportunityId == null) {
            return new List<OpportunityLineItem>();
        }

        List<OpportunityLineItem> oppLineItems = OppLineItemSelector.getOppLineItemByOppId(opportunityId);

        if (oppLineItems == null || oppLineItems.isEmpty()) {
            return new List<OpportunityLineItem>();
        }

        return oppLineItems;
        
    }

    @AuraEnabled
    public static void deleteOpportunityLineItem(Id lineItemId) {
        if (lineItemId == null) return;

        OpportunityLineItem item = [SELECT Id FROM OpportunityLineItem WHERE Id = :lineItemId LIMIT 1];
        delete item;
    }
}