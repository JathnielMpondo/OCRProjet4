@isTest
private class OppLineItemSelectorTest {
    @isTest
    static void testGetOppLineItemByOppId() {
        // 1. Création du produit
        Product2 product = new Product2(
            Name = 'Produit Test',
            IsActive = true,
            QuantityInStock__c = 50
        );
        insert product;

        // 2. Ajout d'un prix standard obligatoire pour le produit
        Id standardPbId = Test.getStandardPricebookId();
        PricebookEntry standardEntry = new PricebookEntry(
            Product2Id = product.Id,
            Pricebook2Id = standardPbId,
            UnitPrice = 100,
            IsActive = true
        );
        insert standardEntry;

        // 3. Création d'un Pricebook personnalisé
        Pricebook2 customPb = new Pricebook2(Name = 'Pricebook Custom', IsActive = true);
        insert customPb;

        // 4. Entrée dans le Pricebook personnalisé
        PricebookEntry customEntry = new PricebookEntry(
            Product2Id = product.Id,
            Pricebook2Id = customPb.Id,
            UnitPrice = 120,
            IsActive = true
        );
        insert customEntry;

        // 5. Création de l’opportunité liée au Pricebook personnalisé
        Opportunity opp = new Opportunity(
            Name = 'Opp Test',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(10),
            Pricebook2Id = customPb.Id
        );
        insert opp;

        // 6. Création de la ligne produit (OpportunityLineItem)
        OpportunityLineItem oli = new OpportunityLineItem(
            OpportunityId = opp.Id,
            Quantity = 2,
            UnitPrice = 120,
            PricebookEntryId = customEntry.Id
        );
        insert oli;

        // 7. Appel de la méthode à tester
        List<OpportunityLineItem> result = OppLineItemSelector.getOppLineItemByOppId(opp.Id);

        // 8. Vérifications
        System.assertNotEquals(null, result);
        System.assertEquals(1, result.size());
        System.assertEquals(opp.Id, result[0].OpportunityId);
        System.assertEquals(product.Name, result[0].Product2.Name);
        System.assertEquals(120, result[0].UnitPrice);
    }
}