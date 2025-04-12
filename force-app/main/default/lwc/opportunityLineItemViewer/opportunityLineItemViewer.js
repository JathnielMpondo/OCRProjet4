import { LightningElement, api, wire, track } from 'lwc';
import getOpportunityLines from '@salesforce/apex/OppLineItemSelector.getOppLineItemByOppId';
import deleteLineItem from '@salesforce/apex/OppLineItemManager.deleteOpportunityLineItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OpportunityLineItemViewer extends LightningElement {
  @api recordId;
  @track opportunityLines = [];
  @track hasError = false;
  @track errorMessage = '';

  columns = [
    { label: 'Nom du produit', fieldName: 'productName' },
    { label: 'Prix unitaire', fieldName: 'unitPrice', type: 'currency' },
    { label: 'Prix total', fieldName: 'totalPrice', type: 'currency' },
    { label: 'Quantité', fieldName: 'quantity', type: 'number' },
    {
      label: 'Quantité restante',
      fieldName: 'stock',
      type: 'number',
      cellAttributes: {
        class: { fieldName: 'stockWarning' }
      }
    },
    {
      type: 'button-icon',
      fixedWidth: 40,
      typeAttributes: {
        iconName: 'utility:delete',
        title: 'Supprimer',
        name: 'delete',
        alternativeText: 'Supprimer',
        variant: 'bare'
      }
    },
    {
      type: 'button',
      label: 'Voir produit',
      typeAttributes: {
        label: 'Voir produit',
        name: 'viewProduct',
        variant: 'brand'
      }
    }
  ];

  get hasLines() {
    return this.opportunityLines.length > 0;
  }

  connectedCallback() {
    this.loadData();
  }

  loadData() {
    getOpportunityLines({ opportunityId: this.recordId })
      .then(data => {
        this.opportunityLines = data.map(item => ({
          id: item.Id,
          productName: item.Product2.Name,
          unitPrice: item.UnitPrice,
          totalPrice: item.TotalPrice,
          quantity: item.Quantity,
          stock: item.Product2.QuantityInStock__c,
          stockWarning:
            item.Product2.QuantityInStock__c < item.Quantity
              ? 'cell-warning'
              : ''
        }));

        this.hasError = this.opportunityLines.some(
          l => l.stock < l.quantity
        );

        if (this.hasError) {
          this.errorMessage =
            "⚠️ Vous avez au moins une ligne avec un problème de quantité. Veuillez supprimer cette ligne ou réduire sa quantité. Si vous avez absolument besoin de plus de produits, veuillez contacter votre administrateur système.";
        }
      })
      .catch(error => {
        this.showToast('Erreur', error.body.message, 'error');
      });
  }

  handleRowAction(event) {
    const action = event.detail.action.name;
    const row = event.detail.row;

    if (action === 'delete') {
      this.deleteLine(row.id);
    } else if (action === 'viewProduct') {
      window.open('/' + row.productId, '_blank');
    }
  }

  deleteLine(lineId) {
    deleteLineItem({ lineItemId: lineId })
      .then(() => {
        this.showToast('Succès', 'Produit supprimé.', 'success');
        this.loadData();
      })
      .catch(error => {
        this.showToast('Erreur', error.body.message, 'error');
      });
  }

  showToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({ title, message, variant })
    );
  }
}