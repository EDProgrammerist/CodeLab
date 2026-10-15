<?php

return [
    'enabled' => env('EXECUTION_ENABLED', false),
    'verified' => env('RUNNER_CONTAINMENT_VERIFIED', false),
    'url' => env('RUNNER_URL', ''), 'token' => env('RUNNER_TOKEN', ''),
    'image' => env('RUNNER_IMAGE', ''), 'judge' => 'exact-output-v1',
];
