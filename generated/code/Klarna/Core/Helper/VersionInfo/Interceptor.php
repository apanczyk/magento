<?php
namespace Klarna\Core\Helper\VersionInfo;

/**
 * Interceptor class for @see \Klarna\Core\Helper\VersionInfo
 */
class Interceptor extends \Klarna\Core\Helper\VersionInfo implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(\Magento\Framework\App\ProductMetadataInterface $productMetadata, \Magento\Framework\App\State $appState, \Magento\Framework\Module\ResourceInterface $resource)
    {
        $this->___init();
        parent::__construct($productMetadata, $appState, $resource);
    }

    /**
     * {@inheritdoc}
     */
    public function getVersion($packageName)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getVersion');
        return $pluginInfo ? $this->___callPlugins('getVersion', func_get_args(), $pluginInfo) : parent::getVersion($packageName);
    }

    /**
     * {@inheritdoc}
     */
    public function getMageMode()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getMageMode');
        return $pluginInfo ? $this->___callPlugins('getMageMode', func_get_args(), $pluginInfo) : parent::getMageMode();
    }

    /**
     * {@inheritdoc}
     */
    public function getMageVersion()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getMageVersion');
        return $pluginInfo ? $this->___callPlugins('getMageVersion', func_get_args(), $pluginInfo) : parent::getMageVersion();
    }

    /**
     * {@inheritdoc}
     */
    public function getMageEdition()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getMageEdition');
        return $pluginInfo ? $this->___callPlugins('getMageEdition', func_get_args(), $pluginInfo) : parent::getMageEdition();
    }

    /**
     * {@inheritdoc}
     */
    public function getModuleVersionString(string $version, string $caller) : string
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getModuleVersionString');
        return $pluginInfo ? $this->___callPlugins('getModuleVersionString', func_get_args(), $pluginInfo) : parent::getModuleVersionString($version, $caller);
    }
}
