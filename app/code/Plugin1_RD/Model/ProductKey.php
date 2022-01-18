<?php

declare(strict_types=1);

namespace Plugin1_RD\Model;

use Magento\Catalog\Api\Data\ProductInterface;

/**
 * Class ProductKey
 *
 * @package Training\PluginExample\Model
 */
class ProductKey
{
    public function getKey(ProductInterface $product, string $prefix = 'Item'): string
    {
        return sprintf('%s : %s', $prefix, $product->getSku());
    }
}
