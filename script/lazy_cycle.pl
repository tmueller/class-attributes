use strict;
use 5.010;

{
    package T;
    use Moose;

    has t => (
        is => "rw",
        lazy => 1,
        predicate => "has_t",
        clearer => "clear_t",
        builder => "_build_t",
    );

    has t2 => (
        is => "rw",
        lazy => 1,
        predicate => "has_t2",
        clearer => "clear_t2",
        default => 1
    );

    sub _build_t { return 1; }

}

my @tests = (T->new(), T->new(t => 5, t2 => 6));

for my $t (@tests) {
    say 't after new:', $t->t;
    say 't ', $t->has_t ? "has t" : "doesnt have t";
    $t->clear_t;
    say 't has_t after clear:', $t->has_t;
    say 't after clear:', $t->t;
    say 't has_t after clear:', $t->has_t;


    say 't2 after new:', $t->t2;
    say 't2 ', $t->has_t2 ? "has t" : "doesnt have t";
    $t->clear_t2;
    say 't2 has_t after clear:', $t->has_t2;
    say 't2 after clear:', $t->t2;
    say '-' x 15;
}