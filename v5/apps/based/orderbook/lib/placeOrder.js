export default async function placeOrder (parent, orderData) {
    console.log('placeOrder', orderData)

    let marketPair = $('#market-pairs').val();

    /*
     const orderData = {
      owner: this.bp.me,
      pair: 'GBP/BUX',
      side: 'buy',
      amount: 0.1,
      price: 30000,
    };
    */

    let result;
    try {
      result = this.client.apiRequest('/market/GBP-BUX', 'POST', orderData);
      console.log('placeOrder result', result);


    } catch (error) {
      throw error;
    }
    await this.listOrdersPerMarket(parent, marketPair);

    return result;

}