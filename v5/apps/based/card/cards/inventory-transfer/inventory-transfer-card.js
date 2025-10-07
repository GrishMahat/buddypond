export default function applyData(el, data, cardClass, parentWindow) {
    const $el = $(el);

    console.log('applyData inventory-gift-card', data);

    // Extract item data with defaults for optional metadata
    const item = {
        key: data.item.key,
        to_player_id: data.item.to_player_id,
        from_player_id: data.item.from_player_id,
        description: data.item.item_def.description || 'No description available',
        quantity: data.item.quantity || 1,
        rarity: data.item.item_def.rarity || 'Common',
        metadata: {
            image: data.item.metadata?.image || '', // URL to item image
            weight: data.item.metadata?.weight || null,
            value: data.item.metadata?.value || null,
            mutation: data.item.metadata?.mutation || null
        }
    };

    // Set the gift card title (e.g., "Gift from [from_player_id] to [to_player_id]")
    const $title = $el.find('.inventory-gift-title');
    let headerTransferType = '';
    if (data.transferType === 'gift') {
      headerTransferType = 'Gift';
    }
    if (data.transferType === 'crafted') {
      headerTransferType = 'Crafted Item';
    }


    $title.text(`${headerTransferType}: ${item.key} from ${item.from_player_id} to ${item.to_player_id}`);

    // Build the details section with all available metadata
    const $details = $el.find('.inventory-gift-details');
    let detailsHtml = `
        <div><strong>Description:</strong> ${item.description}</div>
        <div><strong>Quantity:</strong> ${item.quantity}</div>
        <div><strong>Rarity:</strong> ${item.rarity}</div>
    `;
    if (item.metadata.weight) {
        detailsHtml += `<div><strong>Weight:</strong> ${item.metadata.weight}</div>`;
    }
    if (item.metadata.value) {
        detailsHtml += `<div><strong>Value:</strong> ${item.metadata.value}</div>`;
    }
    if (item.metadata.mutation) {
        detailsHtml += `<div><strong>Mutation:</strong> ${item.metadata.mutation}</div>`;
    }
    $details.html(detailsHtml);

    // Handle the item image
    const $image = $el.find('.inventory-gift-image');
    const imageUrl = item.metadata.image ? item.metadata.image : data.url || ''; // Fallback to data.url if metadata.image is missing
    if (imageUrl) {
        if (window.discordMode) {
            $image.attr('src', imageUrl.replace('https://files.buddypond.com', bp.config.cdn));
        } else {
            $image.attr('src', imageUrl);
        }
        $image.show(); // Ensure image is visible
    } else {
        $image.hide(); // Hide image element if no URL is provided
    }

    // Add onload event to scroll to bottom when image loads
    $image.on('load', function () {
        if (cardClass.bp?.apps?.buddylist) {
            cardClass.bp.apps.buddylist.scrollToBottom(parentWindow.content);
        }
    });

    // Lightbox click handler
    if (imageUrl) {
        $image.on('click', () => {
            this.bp.apps.ui.showLightBox(imageUrl);
        });
    }

    // Remix controls context (unchanged from original)
    if (data.message.type === 'pond') {
        $el.find('.remixPaint').data('output', data.message.type);
        $el.find('.remixPaint').data('context', data.message.to);
    } else {
        $el.find('.remixPaint').data('output', data.message.type);
        if (data.message.from === this.bp.me) {
            $el.find('.remixPaint').data('context', data.message.to);
        } else {
            $el.find('.remixPaint').data('context', data.message.from);
        }
    }

    // Optional: Remove JSON.stringify from message text to avoid clutter
    data.message.text = ''; // Clear text or set to a user-friendly message if needed
}