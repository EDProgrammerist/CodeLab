<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProvisionInstructor extends Command
{
    protected $signature = 'codelab:provision-instructor {email} {--name=}';

    protected $description = 'Provision an instructor and email a private password-setup link; requires trusted operator shell access.';

    public function handle(): int
    {
        $data = ['email' => Str::lower(trim($this->argument('email'))), 'name' => $this->option('name')];
        $validator = Validator::make($data, ['email' => 'required|email|max:254|unique:users,email', 'name' => 'required|string|max:100']);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }
        $user = new User;
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->role = 'instructor';
        $user->password = Str::random(64);
        $user->save();
        $status = Password::sendResetLink(['email' => $user->email]);
        if ($status !== Password::ResetLinkSent) {
            $this->error('Account created, but setup mail was not sent. Request a reset from the sign-in page.');

            return self::FAILURE;
        }
        $this->info('Instructor created. A private setup link was sent. Email verification is required after first sign-in.');

        return self::SUCCESS;
    }
}
