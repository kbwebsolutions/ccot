<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Overrides for behat navigation.
 * @author    Guy Thomas <osdev@blackboard.com>
 * @copyright Copyright (c) 2017 Blackboard Inc.
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

use Behat\Mink\Exception\ExpectationException as ExpectationException,
    Behat\Mink\Element\NodeElement as NodeElement;

require_once(__DIR__ . '/../../../../lib/tests/behat/behat_navigation.php');

/**
 * Overrides to make behat navigation work with ccot.
 *
 * @author    Guy Thomas <osdev@blackboard.com>
 * @copyright Copyright (c) 2017 Blackboard Inc.
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_theme_ccot_behat_navigation extends behat_navigation {

    /**
     * Check that the browser js engine can target things via xpath (document.evaluate).
     * @return boolean
     */
    private function browser_supports_document_evaluate() {
        static $supportsxpath = null;

        if ($supportsxpath === null) {
            $session = $this->getSession();
            $retstr = $session->evaluateScript('return (document.evaluate !== undefined);');
            $retstr = trim(strtolower($retstr));
            $supportsxpath = !empty($retstr);
        }

        return $supportsxpath;
    }

    /**
     * Attempt to trigger click event on node instead of actually clicking on it.
     * This stops the Navigation or Administration tree from clicking on a link inside the expandable node (p tag)
     * when the config value linkadmincategories is enabled.
     * @param NodeElement $node
     */
    protected function js_trigger_click($node) {
        $session = $this->getSession();
        $xpath = addslashes_js($node->getXpath());

        $supportsxpath = $this->browser_supports_document_evaluate();
        if ($supportsxpath) {
            $script = <<<EOF
                var node = document.evaluate(
                    "$xpath", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                ).singleNodeValue;
                node.click();
EOF;
            $session->executeScript($script);
        } else {
            $node->click();
        }
    }

    protected function select_node_in_navigation($nodetext, $parentnodes) {
        $nodetoclick = $this->find_node_in_navigation($nodetext, $parentnodes);
        // Throw exception if no node found.
        if (!$nodetoclick) {
            throw new ExpectationException('Navigation node "' . $nodetext . '" not found under "' .
                implode($parentnodes, ' > ') . '"', $this->getSession());
        }

        $settings = $this->find('css', '.block_settings');
        // Only attempt to open the admin menu if its not already open.
        if (!$settings->isVisible()) {
            $this->execute('behat_general::i_click_on', ['#admin-menu-trigger', 'css_element']);
        }

        $nodetoclick->click();
    }

    /**
     * Just go to the course page as ccot doesn't have the same concept of editing mode.
     */
    public function i_am_on_course_homepage_with_editing_mode_on($coursefullname) {
        // ccot doesn't really have the concept of edit mode.
        $this->i_am_on_course_homepage($coursefullname);
    }

}
