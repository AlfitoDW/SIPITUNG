<?php

test('registration screen can be rendered', function () {
    $this->markTestSkipped('Self-service registration has no frontend page in this application.');

    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $this->markTestSkipped('Self-service registration has no frontend page in this application.');

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
