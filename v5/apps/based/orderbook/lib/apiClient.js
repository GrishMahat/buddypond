const client = {};

client.endpoint = buddypond.orderbookEndpoint;

client.apiRequest = async (uri, method = 'GET', data = null) => {

    const options = {
        method: method
    };

    let headers = {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "X-Me": buddypond.me
      };
      if (buddypond.qtokenid) {
        headers["Authorization"] = `Bearer ${buddypond.qtokenid}`; // ✅ Use Authorization header
      }


    if (data) {
        options.body = JSON.stringify(data);
    }

    options.headers = headers;
    console.log('cccc', client)
    let url = `${client.endpoint}${uri}`;
    console.log('orderbook client making api request', url, options);
 

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error in API request:', error);
        throw error;
    }

};

export default client;