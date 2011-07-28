use strict;
use 5.010;

{
    package T1;
    use Moose;

    has t => (
        is      => "rw"
    );
}

{
    package T2;
    use Moose;
    extends 'T1';

    has t => (
        is      => "ro"
    );
}


my $test = T2->new(t => 1);

say $test->t;
say $test->can('t');