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
 * Cache definition for ccot.
 *
 * @package   theme_ccot
 * @author    Guy Thomas <osdev@blackboard.com>
 * @copyright Copyright (c) 2016 Blackboard Inc.
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

$definitions = array(
    'webservicedefinitions' => [
        'mode'               => cache_store::MODE_APPLICATION,
        'simplekeys'         => false,
        'simpledata'         => false
    ],
    // This is used so that we can invalidate session level caches if the course completion settings for a course
    // change.
    'course_completion_progress_ts' => [
        'mode'               => cache_store::MODE_APPLICATION,
        'simplekeys'         => true,
        'simpledata'         => true,
        'staticacceleration' => false
    ],
    // This is used to cache completion data per course / user.
    'course_completion_progress' => [
        'mode'               => cache_store::MODE_SESSION,
        'simplekeys'         => true,
        'simpledata'         => false,
        'staticacceleration' => false
    ],
    // This is used to cache deadlines per user.
    'activity_deadlines' => [
        'mode'               => cache_store::MODE_SESSION,
        'simplekeys'         => true,
        'simpledata'         => false,
        'staticacceleration' => false
    ],
    'generalstaticappcache' => [
        'mode'               => cache_store::MODE_APPLICATION,
        'simplekeys'         => true,
        'simpledata'         => false,
        'staticacceleration' => true
    ]
);