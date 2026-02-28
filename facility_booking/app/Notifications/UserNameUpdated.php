<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\User;

class UserNameUpdated extends Notification
{
    use Queueable;

    public $user;
    public $oldName;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user, string $oldName)
    {
        $this->user = $user;
        $this->oldName = $oldName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'old_name' => $this->oldName,
            'new_name' => $this->user->name,
            'message' => "User {$this->oldName} changed their name to {$this->user->name}.",
        ];
    }
}
