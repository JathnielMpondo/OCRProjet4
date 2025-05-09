@isTest
private class OppLineItemControllerTest {

    @isTest
    static void TestGetOppLineItemByOppId_WithValidId() {
        // 1. Créer un produit
        Product2 product = new Product2(
            Name = 'Produit Test',
            IsActive = true,
            QuantityInStock__c = 10
        );
        insert product;

        // 2. Ajouter une entrée dans le Pricebook Standard
        Id standardPbId = Test.getStandardPricebookId();
        PricebookEntry standardEntry = new PricebookEntry(
            Product2Id = product.Id,
            Pricebook2Id = standardPbId,
            UnitPrice = 100,
            IsActive = true
        );
        insert standardEntry;

        // 3. Créer un Pricebook custom
        Pricebook2 customPb = new Pricebook2(Name = 'Custom Pricebook', IsActive = true);
        insert customPb;

        // 4. Créer une entrée dans ce Pricebook
        PricebookEntry customEntry = new PricebookEntry(
            Product2Id = product.Id,
            Pricebook2Id = customPb.Id,
            UnitPrice = 120,
            IsActive = true
        );
        insert customEntry;

        // 5. Créer une opportunité liée au Pricebook custom
        Opportunity opp = new Opportunity(
            Name = 'Opp Test',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(10),
            Pricebook2Id = customPb.Id
        );
        insert opp;

        // 6. Créer une ligne de produit
        OpportunityLineItem oli = new OpportunityLineItem(
            OpportunityId = opp.Id,
            Quantity = 2,
            UnitPrice = 120,
            PricebookEntryId = customEntry.Id
        );
        insert oli;

        // 7. Appel de la méthode à tester
        List<OpportunityLineItem> result = OppLineItemController.getOppLineItemByOppId(opp.Id);

        // 8. Vérifications
        System.assertNotEquals(null, result);
        System.assertEquals(1, result.size());
    }

    @isTest
    static void testGetOppLineItemByOppId_WithNullId() {
        // Appel de la méthode avec un Id nul
        List<OpportunityLineItem> result = OppLineItemController.getOppLineItemByOppId(null);
        System.assertNotEquals(null, result);
        System.assertEquals(0, result.size());
    }

    @isTest
    static void testDeleteOpportunityLineItem() {
        // 1. Créer un produit
        Product2 product = new Product2(
            Name = 'Produit à supprimer',
            IsActive = true,
            QuantityInStock__c = 5
        );
        insert product;

        // 2. Récupérer le Pricebook standard
        Id standardPbId = Test.getStandardPricebookId();
        PricebookEntry standardEntry = new PricebookEntry(
            Product2Id = product.Id,
            Pricebook2Id = standardPbId,
            UnitPrice = 80,
            IsActive = true
        );
        insert standardEntry;

        // 3. Créer une opportunité
        Opportunity opp = new Opportunity(
            Name = 'Opp suppression',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(7),
            Pricebook2Id = standardPbId
        );
        insert opp;

        // 4. Créer une ligne d'opportunité
        OpportunityLineItem oli = new OpportunityLineItem(
            OpportunityId = opp.Id,
            Quantity = 1,
            UnitPrice = 80,
            PricebookEntryId = standardEntry.Id
        );
        insert oli;

        // 5. Vérification avant suppression
        System.assertEquals(1, [SELECT COUNT() FROM OpportunityLineItem WHERE Id = :oli.Id]);

        // 6. Appel de la méthode à tester
        Test.startTest();
        OppLineItemController.deleteOpportunityLineItem(oli.Id);
        Test.stopTest();

        // 7. Vérification après suppression
        Integer count = [SELECT COUNT() FROM OpportunityLineItem WHERE Id = :oli.Id];
        System.assertEquals(0, count, 'La ligne d\'opportunité aurait dû être supprimée');
    }
}